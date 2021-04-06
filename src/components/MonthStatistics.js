import { Component } from 'react';
import { FirebaseDatabaseNode } from '@react-firebase/database';
import { Button, ButtonGroup } from 'react-bootstrap';
import { number_format, format_curr } from './DataViewer.style';

import firebase from 'firebase/app';
import moment from 'moment';
import MonthChart from './MonthChart';

const getPayday = (targetYM) => {
  const payday = moment({
    year: targetYM.substr(0, 4),
    month: targetYM.substr(5, 2) - 1,
    day: '20',
  });
  while (payday.weekday() === 0 || payday.weekday() === 6) {
    payday.subtract(1, 'day');
  }
  return payday;
};

const getPrevMonth = (targetYM) => {
  const date = moment({
    year: targetYM.substr(0, 4),
    month: targetYM.substr(5, 2) - 1,
  });
  date.subtract(1, 'month');
  return date.format('YYYY-MM');
};

const getPayspan = (targetYM) => {
  return {
    begin: getPayday(getPrevMonth(targetYM)),
    end: getPayday(targetYM).subtract(1, 'milliseconds'),
  };
};

const tranAsRow = (tran) => {
  return (
    <>
      <td
        children={moment(tran.timestamp).format('hh[:]mm')}
        className='border'
      />
      <td children={tran.note} className='border' />
      <td children={format_curr(tran.balance)} className='border' />
      <td children={format_curr(tran.delta)} className='border' />
    </>
  );
};

class MonthStatistics extends Component {
  state = {
    targetYM: moment().format('YYYY-MM'),
    current: {},
    showTable: false,
  };

  componentDidMount() {
    this.updateTargetYYMM(this.state.targetYM);
  }

  updateCurrent(key, value) {
    let new_current = this.state.current;
    new_current[key] = value;
    this.setState({ current: new_current });
  }

  async updateTargetYYMM(targetYM) {
    const current = {};
    current.targetMonth = targetYM;
    current.prevMonth = getPrevMonth(targetYM);
    current.paySpan = getPayspan(targetYM);

    const days = [];
    const day_stats = {};
    const time_stepper = moment(current.paySpan.begin);
    let k = 0;
    while (time_stepper < current.paySpan.end) {
      days.push(moment(time_stepper));
      const mm_dd = time_stepper.format('MM-DD');
      day_stats[mm_dd] = {
        dayFromPayday: k,
        endBalance: null,
        row_span: 1,
        totalLoss: 0,
        transactions: [],
        moneyPerDay: 0,
        deltaMoneyPerDay: 0,
        moment: moment(time_stepper),
      };
      k += 1;
      time_stepper.add(1, 'day');
    }

    const this_month_ret = await firebase
      .app()
      .database()
      .ref(`transactions/${targetYM}`)
      .get();
    const prev_month_ret = await firebase
      .app()
      .database()
      .ref(`transactions/${getPrevMonth(targetYM)}`)
      .get();
    const transactions = Object.assign(
      {},
      prev_month_ret.val(),
      this_month_ret.val()
    );

    for (const timestamp in transactions) {
      if (
        moment(timestamp) >= current.paySpan.begin &&
        moment(timestamp) <= current.paySpan.end
      ) {
        const mm_dd = timestamp.substr(5, 5);
        const tran = transactions[timestamp];
        const dayStat = day_stats[mm_dd];
        if (tran.delta < 0) dayStat.totalLoss += Number(tran.delta);
        dayStat.endBalance = Number(tran.balance);
        dayStat.transactions.push(tran);
        day_stats[mm_dd] = dayStat;
      }
    }

    let last_balance = -1;
    let lastMoneyPerDay = null;
    if (transactions.length > 0)
      last_balance = transactions[0].balance - transactions[0].delta;
    for (const mm_dd in day_stats) {
      const dayStat = day_stats[mm_dd];
      dayStat.rowSpan = Math.max(1, dayStat.transactions.length);
      dayStat.dayFromPayday = k - dayStat.dayFromPayday;
      if (dayStat.endBalance === null) dayStat.endBalance = last_balance;
      else last_balance = dayStat.endBalance;
      dayStat.moneyPerDay = Math.floor(
        dayStat.endBalance / dayStat.dayFromPayday
      );
      if (lastMoneyPerDay === null) lastMoneyPerDay = dayStat.moneyPerDay;
      dayStat.deltaMoneyPerDay = dayStat.moneyPerDay - lastMoneyPerDay;
      lastMoneyPerDay = dayStat.moneyPerDay;
      dayStat[mm_dd] = dayStat;
    }

    current.days = days;
    current.dayStats = day_stats;
    this.setState({ current: current, targetYM: targetYM });
  }

  render() {
    const current = this.state.current;
    return (
      <div>
        <FirebaseDatabaseNode
          path='month_of_transactions/'
          children={(d) => (
            <ButtonGroup toggle className='my-3'>
              <Button size='sm' children='조회연월' variant='outline-dark' />
              {d.value &&
                Object.entries(d.value).map(([ym]) => (
                  <Button
                    key={ym}
                    size='sm'
                    variant='outline-dark'
                    children={ym}
                    onClick={() => this.updateTargetYYMM(ym)}
                  />
                ))}
            </ButtonGroup>
          )}
        />
        <p children={getPayday(this.state.targetYM).format('YYYY-MM-DD')} />
        <div className='d-flex container-xl flex-column'>
          <Button
            size='sm'
            children='테이블'
            variant='outline-primary'
            onClick={() => this.setState({ showTable: !this.state.showTable })}
          />
          {current.days && current.dayStats && this.state.showTable && (
            <table>
              <thead>
                {[
                  '일자',
                  '총 소비',
                  '말잔',
                  '가사용금',
                  '가사용금 변화',
                  '시간',
                  '노트',
                  '잔액',
                  '변동',
                ].map((text) => (
                  <th children={text} className='border' />
                ))}
              </thead>
              <tbody>
                {current.days.map((day) => {
                  const dayStat = current.dayStats[day.format('MM-DD')];
                  const trans = dayStat.transactions;

                  return (
                    <>
                      <tr>
                        {[
                          day.format('MM[/]DD[(]ddd[)]'),
                          number_format.format(dayStat.totalLoss),
                          number_format.format(dayStat.endBalance),
                          number_format.format(dayStat.moneyPerDay),
                          format_curr(dayStat.deltaMoneyPerDay),
                        ].map((text) => (
                          <td
                            children={text}
                            className='border text-right'
                            rowSpan={dayStat.rowSpan}
                          />
                        ))}
                        {trans.length > 0 ? (
                          tranAsRow(trans[0])
                        ) : (
                          <>
                            <td children='-' className='border ' />
                            <td children='-' className='border ' />
                            <td children='-' className='border ' />
                            <td children='-' className='border ' />
                          </>
                        )}
                      </tr>
                      {trans.length > 1 &&
                        trans.map(
                          (tran, idx) => idx > 0 && <tr>{tranAsRow(tran)}</tr>
                        )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
          {current.days && current.dayStats && !this.state.showTable && (
            <MonthChart current={current} />
          )}
        </div>
      </div>
    );
  }
}

export default MonthStatistics;
