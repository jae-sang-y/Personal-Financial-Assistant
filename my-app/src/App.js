import './App.css';

import { Container, Dropdown, FormControl, Button } from 'react-bootstrap';
import { Component } from 'react';
import {
  build_transaction,
  get_available_dates,
  get_lastest_YY_MM,
  get_payday_month,
  formatAsIncome,
  formatAsLoss,
  formatAsDeposit,
  formatAsIncome_00,
  formatAsLoss_00,
  formatAsDelta,
} from './modules/common';
import { get_test_data } from './modules/load_test_data';
import moment from 'moment';
import { Doughnut, Line } from 'react-chartjs-2';
import monthlyStatistic from './modules/monthlyStatistic';
import dailyStatistic from './modules/dailyStatistic';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      all_transactions: [],
      targetDate: get_lastest_YY_MM(),
      targetDate_isValid: true,
      validatedTarget_YY_MM: get_lastest_YY_MM(),
      targetPaydayMonth: get_payday_month(get_lastest_YY_MM()),
      validatedTarget_YY_MM_DD: null,

      monthlyStatistics: null,
      dailyStatistics: null,
      thisMonthIndex: null,

      viewMode: 'line',
    };
  }
  componentDidMount() {
    get_test_data().then((text) => {
      this.preprocessMyDataFile(text);

      const monthlyStatistics = {};
      const dailyStatistics = {};
      const paydays = {};
      const allTransactions = this.state.all_transactions;
      let availableDays = [];

      for (const availableDate of get_available_dates()) {
        monthlyStatistics[availableDate.YY_MM] = monthlyStatistic(
          availableDate,
          allTransactions
        );
        paydays[monthlyStatistics[availableDate.YY_MM].startDay] = true;
        availableDays = availableDays.concat(
          monthlyStatistics[availableDate.YY_MM].availableDays
        );
      }

      let yesterdayStatistic = null;
      availableDays.forEach((availableDay) => {
        dailyStatistics[availableDay] = dailyStatistic(
          availableDay,
          allTransactions,
          paydays,
          yesterdayStatistic
        );
        yesterdayStatistic = dailyStatistics[availableDay];
      });

      this.setState({
        monthlyStatistics: monthlyStatistics,
        dailyStatistics: dailyStatistics,
      });
    });
    this.setState({ availableDates: get_available_dates() });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.validatedTarget_YY_MM !== this.state.validatedTarget_YY_MM) {
      this.onUpdatevalidatedTarget_YY_MM(this.state.validatedTarget_YY_MM);
    }
  }

  preprocessMyDataFile(text) {
    const result = [];
    const rows = text.split('\n');
    let pass_first_row = true;

    console.log('==================');
    for (const row of rows) {
      if (pass_first_row) {
        pass_first_row = false;
        continue;
      }
      const cells = row.split('|');
      if (cells[0] === '합계') break;
      if (cells.length !== 9) throw cells;

      const tran = build_transaction(cells);
      if (tran !== undefined) result.push(tran);
    }
    this.setState({ all_transactions: result });
  }

  onValidate_TargetDate(targetDate) {
    if (targetDate.length !== 5) {
      this.setState({ targetDate_isValid: false });
      return;
    }
    if (targetDate[2] !== '-') {
      this.setState({ targetDate_isValid: false });
      return;
    }
    try {
      const YY = parseInt(targetDate.substr(0, 2));
      const MM = parseInt(targetDate.substr(3, 2));
      if (YY < 0 || YY > 99 || MM < 1 || MM > 12) {
        this.setState({ targetDate_isValid: false });
        return;
      }
      this.setState({
        targetDate_isValid: true,
        validatedTarget_YY_MM: targetDate,
      });
      return;
    } catch {
      this.setState({ targetDate_isValid: false });
      return;
    }
  }

  onUpdatevalidatedTarget_YY_MM(validatedTarget_YY_MM) {
    this.setState({
      targetPaydayMonth: get_payday_month(validatedTarget_YY_MM),
    });
  }

  onClickPrevMonth() {
    const idx = this.state.availableDates.findIndex(
      (availableDate) =>
        availableDate.YY_MM === this.state.validatedTarget_YY_MM
    );
    if (idx !== -1 && idx > 0) {
      this.setState({
        targetDate: this.state.availableDates[idx - 1].YY_MM,
        validatedTarget_YY_MM: this.state.availableDates[idx - 1].YY_MM,
      });
    }
  }

  onClickNextMonth() {
    const idx = this.state.availableDates.findIndex(
      (availableDate) =>
        availableDate.YY_MM === this.state.validatedTarget_YY_MM
    );
    if (idx !== -1 && idx < this.state.availableDates.length - 1) {
      this.setState({
        targetDate: this.state.availableDates[idx + 1].YY_MM,
        validatedTarget_YY_MM: this.state.availableDates[idx + 1].YY_MM,
      });
    }
  }

  moduleViewModeRadioButtons() {
    return (
      <div
        className='d-flex justify-content-center align-items-center btn-group btn-group-toggle'
        data-toggle='buttons'
      >
        <Button
          className='btn-secondary py-0'
          style={{ flex: 'none' }}
          size='sm'
          onClick={() => this.setState({ viewMode: 'list' })}
        >
          <input type='radio' name='options' />
          List
        </Button>
        <Button
          className='btn-secondary py-0'
          style={{ flex: 'none' }}
          size='sm'
          onClick={() => this.setState({ viewMode: 'pie' })}
        >
          <input type='radio' name='options' />
          Pie
        </Button>
        <Button
          className='active btn-secondary py-0'
          style={{ flex: 'none' }}
          size='sm'
          onClick={() => this.setState({ viewMode: 'line' })}
        >
          <input type='radio' name='options' />
          Line
        </Button>
      </div>
    );
  }

  moduleTable() {
    const thisMonthStatistics = this.state.monthlyStatistics[
      this.state.validatedTarget_YY_MM
    ];
    const datesetToTable = (dataset) => {
      return (
        <table
          className='mx-auto'
          children={
            <tbody>
              {dataset.map((row, row_idx) => (
                <tr
                  style={{ fontSize: '0.75rem' }}
                  children={row.map((cell) => (
                    <td
                      className={
                        'border py-0 ' +
                        (row_idx % 2 === 1 ? 'text-right ' : 'text-center')
                      }
                    >
                      {cell}
                    </td>
                  ))}
                />
              ))}
            </tbody>
          }
        />
      );
    };
    return datesetToTable([
      [
        '시작잔액',
        '종료잔액',
        '총 수입',
        '총 지출',
        '차액',
        '월일',
        '일별수입',
        '일별지출',
        '일별변화',
        '잔여일',
        '상쇄소비',
        '소진소비',
      ],
      [
        formatAsDeposit(thisMonthStatistics.startBalance),
        formatAsDeposit(thisMonthStatistics.endBalance),
        formatAsIncome(thisMonthStatistics.sumOfIncome),
        formatAsLoss(thisMonthStatistics.sumOfLoss),
        formatAsDelta(thisMonthStatistics.deltaBalance),
        thisMonthStatistics.daysOfMonth,
        formatAsIncome_00(thisMonthStatistics.incomeByDay),
        formatAsLoss_00(thisMonthStatistics.lossByDay),
        formatAsDelta(thisMonthStatistics.deltaByDay),
        thisMonthStatistics.leftDays,
        formatAsLoss_00(thisMonthStatistics.targetDeltaToStart),
        formatAsLoss_00(thisMonthStatistics.targetDeltaToZero),
      ],
    ]);
  }

  moduleDropdown() {
    return (
      <div className='d-flex flex-row justify-content-center mt-3'>
        <Button
          children={'◀'}
          onClick={() => this.onClickPrevMonth()}
          size='sm'
        />
        <Dropdown
          onSelect={(none, e) => {
            const targetDate = e.target.target;
            this.setState({ targetDate: targetDate });
            this.onValidate_TargetDate(targetDate);
          }}
        >
          <Dropdown.Toggle
            className='border d-flex flex-row align-items-center'
            variant='white'
            size='sm'
          >
            <FormControl
              type='text'
              className={
                'p-0 ' +
                (this.state.targetDate_isValid
                  ? 'border-0 '
                  : 'border-top-0 border-left-0 border-right-0 border-bottom border-danger rounded-0')
              }
              placeholder='21-03'
              style={{ boxShadow: '0 0 0 0' }}
              value={this.state.targetDate}
              onChange={(e) => e.preventDefault()}
              onInput={(e) => {
                const ch = e.nativeEvent.data;
                if (ch === null) {
                  let new_text = this.state.targetDate;
                  if (new_text.length > 0) {
                    let delete_count = 1;
                    if (new_text.length === 3) delete_count += 1;
                    this.setState({
                      targetDate: new_text.substr(
                        0,
                        new_text.length - delete_count
                      ),
                    });
                  }
                } else {
                  if (ch >= '0' && ch <= '9') {
                    let new_text = this.state.targetDate;
                    if (new_text.length < 5) {
                      new_text += ch;
                      if (new_text.length === 2) new_text += '-';
                      this.setState({ targetDate: new_text });
                    }
                    if (new_text.length === 5)
                      this.onValidate_TargetDate(new_text);
                  }
                }
              }}
            />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {this.state.availableDates !== undefined &&
              this.state.availableDates.map((date, idx) => {
                const timestamp = moment({
                  y: date.y,
                  M: date.m - 1,
                }).format('YY-MM');
                return (
                  <Dropdown.Item key={idx} target={timestamp}>
                    {timestamp}
                  </Dropdown.Item>
                );
              })}
          </Dropdown.Menu>
        </Dropdown>
        <Button
          children={'▶'}
          onClick={() => this.onClickNextMonth()}
          size='sm'
        />
      </div>
    );
  }

  moduleListView() {
    if (this.state.monthlyStatistics === null) return undefined;
    return (
      <table className='mx-auto'>
        <tr>
          <td className='border' children='시간' />
          <td className='border' children='변화값' />
          <td className='border' children='잔액' />
          <td className='border' children='노트' />
          <td className='border' children='태그' />
        </tr>
        {this.state.monthlyStatistics[
          this.state.validatedTarget_YY_MM
        ].transactions.map((tran, idx) => (
          <tr key={idx}>
            <td className='border' children={String(tran.timestamp)} />
            <td className='border text-right' children={String(tran.delta)} />
            <td className='border text-right' children={String(tran.balance)} />
            <td className='border text-left' children={String(tran.note)} />
            <td
              className={
                'border ' + (tran.tag.substr(1, 5) === 'other' && 'bg-danger ')
              }
              children={String(tran.tag)}
            />
          </tr>
        ))}
      </table>
    );
  }

  modulePieView() {
    const thisMonthStatistics = this.state.monthlyStatistics[
      this.state.validatedTarget_YY_MM
    ];
    return (
      <>
        <Doughnut
          redraw={false}
          height='200rem'
          data={{
            labels: thisMonthStatistics.pieLabels,
            datasets: [
              {
                data: thisMonthStatistics.pieData,
                backgroundColor: thisMonthStatistics.pieBgColors,
              },
            ],
          }}
          options={{
            tooltips: {
              callbacks: {
                label: (e) => {
                  return (
                    thisMonthStatistics.pieLabels[e.index] +
                    ' ' +
                    formatAsDeposit(thisMonthStatistics.pieData[e.index])
                  );
                },
              },
            },
          }}
        />
        {Object.keys(thisMonthStatistics.pieOfType).map((key) => {
          return (
            <>
              <span>
                {key}/{thisMonthStatistics.pieOfType[key]}
              </span>
              <br />
            </>
          );
        })}
      </>
    );
  }

  moduleLineView() {
    const thisMonthStatistics = this.state.monthlyStatistics[
      this.state.validatedTarget_YY_MM
    ];
    return (
      <>
        <Line
          redraw={false}
          data={{
            labels: thisMonthStatistics.availableDays,
            datasets: [
              {
                label: 'MaxBalance',
                yAxisID: 'y-axis-1',
                fill: false,
                lineTension: 0,
                borderColor: '#2d9926',
                //backgroundColor: '#8cd38780',
                pointHitRadius: 15,
                data: thisMonthStatistics.availableDays.map((YY_MM_DD) =>
                  this.state.dailyStatistics[YY_MM_DD] === undefined
                    ? undefined
                    : this.state.dailyStatistics[YY_MM_DD].maxBalance
                ),
              },
              {
                label: 'Delta',
                yAxisID: 'y-axis-2',
                fill: false,
                lineTension: 0,
                borderColor: '#F91d16',
                pointHitRadius: 15,
                data: thisMonthStatistics.availableDays.map((YY_MM_DD) =>
                  this.state.dailyStatistics[YY_MM_DD] === undefined
                    ? undefined
                    : -this.state.dailyStatistics[YY_MM_DD].delta
                ),
              },
              {
                label: 'StackLoss',
                yAxisID: 'y-axis-1',
                fill: false,
                lineTension: 0,
                borderColor: '#992d26',
                backgroundColor: '#d38c8780',
                pointHitRadius: 15,
                data: thisMonthStatistics.availableDays.map((YY_MM_DD) =>
                  this.state.dailyStatistics[YY_MM_DD] === undefined
                    ? undefined
                    : this.state.dailyStatistics[YY_MM_DD].stackLoss
                ),
              },
              {
                label: 'Leftover Deposit',
                yAxisID: 'y-axis-1',
                fill: false,
                lineTension: 0,
                borderColor: '#999926',
                backgroundColor: '#d3d38780',
                pointHitRadius: 15,
                data: thisMonthStatistics.availableDays.map((YY_MM_DD) =>
                  this.state.dailyStatistics[YY_MM_DD] === undefined
                    ? undefined
                    : this.state.dailyStatistics[YY_MM_DD].leftDeposit
                ),
              },
            ],
          }}
          options={{
            scales: {
              yAxes: [
                {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  id: 'y-axis-1',
                  ticks: { min: 0 },
                },
                {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  id: 'y-axis-2',
                  ticks: { min: 0 },
                },
              ],
            },
            tooltips: {
              callbacks: {
                label: (e) => formatAsDeposit(e.value),
              },
            },
            onClick: (model, item) => {
              if (item.length > 0)
                this.setState({
                  validatedTarget_YY_MM_DD: this.state.monthlyStatistics[
                    this.state.validatedTarget_YY_MM
                  ].availableDays[item[0]._index],
                });
            },
          }}
        />
      </>
    );
  }

  moduleDailyView() {
    const thisDayStatistics = this.state.dailyStatistics[
      this.state.validatedTarget_YY_MM_DD
    ];
    return (
      <>
        {this.state.validatedTarget_YY_MM_DD}
        <br />
        <Doughnut
          redraw={false}
          height='200rem'
          data={{
            labels: thisDayStatistics.pieLabels,
            datasets: [
              {
                data: thisDayStatistics.pieData,
                backgroundColor: thisDayStatistics.pieBgColors,
              },
            ],
          }}
          options={{
            title: {
              display: true,
              text: `${this.state.validatedTarget_YY_MM_DD} - ${formatAsDeposit(
                thisDayStatistics.trans
                  .filter((tran) => tran.delta < 0)
                  .reduce((acc, tran) => acc - tran.delta, 0)
              )}`,
            },
            tooltips: {
              callbacks: {
                afterLabel: (e) => {
                  return thisDayStatistics.trans
                    .filter((tran) => tran.delta < 0)
                    .map(
                      (tran) =>
                        `${tran.datetime.format('HH:mm:ss')} ${formatAsDeposit(
                          -tran.delta
                        )}`
                    );
                },
                label: (e) => {
                  return (
                    thisDayStatistics.pieLabels[e.index] +
                    ' ' +
                    formatAsDeposit(thisDayStatistics.pieData[e.index])
                  );
                },
              },
            },
          }}
        />
      </>
    );
  }

  render() {
    return (
      <div className='App'>
        {this.state.monthlyStatistics && (
          <Container className='border d-flex flex-column'>
            {this.moduleDropdown()}
            {
              <span
                children={
                  this.state.monthlyStatistics[this.state.validatedTarget_YY_MM]
                    .span.text
                }
              />
            }
            {this.moduleViewModeRadioButtons()}
            {this.moduleTable()}
            {this.state.viewMode === 'list' && this.moduleListView()}
            {this.state.viewMode === 'pie' && this.modulePieView()}
            {this.state.viewMode === 'line' && this.moduleLineView()}
            {this.state.validatedTarget_YY_MM_DD && this.moduleDailyView()}
          </Container>
        )}
      </div>
    );
  }
}

export default App;
