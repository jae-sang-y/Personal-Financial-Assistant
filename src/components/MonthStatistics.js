import { Component } from 'react';
import { FirebaseDatabaseNode } from '@react-firebase/database';
import { Button, ButtonGroup } from 'react-bootstrap';
import {
  number_format,
  format_curr,
  format_timestamp,
} from './DataViewer.style';

import firebase from 'firebase/app';
import moment from 'moment';

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
  };

  componentDidMount() {
    this.updateTargetYYMM();
  }

  updateCurrent(key, value) {
    let new_current = this.state.current;
    new_current[key] = value;
    this.setState({ current: new_current });
  }

  async updateTargetYYMM() {
    const current = {};
    current.prevMonth = getPrevMonth(this.state.targetYM);
    current.paySpan = getPayspan(this.state.targetYM);

    const days = [];
    const day_stats = {};
    const time_stepper = moment(current.paySpan.begin);
    while (time_stepper < current.paySpan.end) {
      days.push(moment(time_stepper));
      const mm_dd = time_stepper.format('MM-DD');
      day_stats[mm_dd] = {
        transactions: [],
      };
      time_stepper.add(1, 'day');
    }

    const this_month_ret = await firebase
      .app()
      .database()
      .ref(`transactions/${this.state.targetYM}`)
      .get();
    const prev_month_ret = await firebase
      .app()
      .database()
      .ref(`transactions/${getPrevMonth(this.state.targetYM)}`)
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
      )
        day_stats[timestamp.substr(5, 5)].transactions.push(
          transactions[timestamp]
        );
    }

    current.days = days;
    current.dayStats = day_stats;
    this.setState({ current: current });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.targetYM !== this.state.targetYM) {
      this.updateTargetYYMM();
    }
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
                    onClick={() => this.setState({ targetYM: ym })}
                  />
                ))}
            </ButtonGroup>
          )}
        />
        <p children={getPayday(this.state.targetYM).format('YYYY-MM-DD')} />
        <div className='d-flex container'>
          {current.days && current.dayStats && (
            <table>
              <thead>
                {['일자', '시간', '노트', '잔액', '변동'].map((text) => (
                  <th children={text} className='border' />
                ))}
              </thead>
              <tbody>
                {current.days.map((day) => {
                  const trans =
                    current.dayStats[day.format('MM-DD')].transactions;
                  return (
                    <>
                      <tr>
                        <td
                          children={day.format('MM[/]DD[(]ddd[)]')}
                          className='border'
                          rowSpan={Math.max(
                            1,
                            current.dayStats[day.format('MM-DD')].transactions
                              .length
                          )}
                        />
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
        </div>
      </div>
    );
  }
}

export default MonthStatistics;
