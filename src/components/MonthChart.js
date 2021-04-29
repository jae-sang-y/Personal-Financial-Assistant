import { Component } from 'react';
import { Line, defaults } from 'react-chartjs-2';
import moment from 'moment';
import { formatKorean, format_curr } from './DataViewer.style';

defaults.global.animation.duration = 0;

class MonthChart extends Component {
  state = {
    targetIndex: undefined,
  };
  getData(canvas) {
    const current = this.props.current;

    const balance_dataset = {
      order: 100,
      label: 'Balance',
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 15,
      xAxisID: 'x-axis-1',
      yAxisID: 'y-axis-1',
      borderColor: '#7787e3D0',
      backgroundColor: '#7787e3D0',
      fill: false,
      data: [],
    };

    const expected_balance_dataset = {
      order: 110,
      label: 'Balance(exp)',
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 15,
      xAxisID: 'x-axis-1',
      yAxisID: 'y-axis-1',
      borderColor: '#a7a7e3D0',
      backgroundColor: '#6777e3D0',
      borderDash: [5, 5],
      fill: false,
      data: [],
    };

    let last_end_balance = null;
    let loss_dataset = [];
    let avg_loss_without_bigger_value = null;

    Object.values(current.dayStats).forEach((dayStat, k) => {
      if (dayStat.moment < moment()) {
        balance_dataset.data.push(dayStat.endBalance);
        if (last_end_balance === null) last_end_balance = dayStat.endBalance;
        loss_dataset.push(dayStat.totalLoss);
        last_end_balance = dayStat.endBalance;
        expected_balance_dataset.data.push(NaN);
      }
      if (dayStat.moment > moment()) {
        if (avg_loss_without_bigger_value === null) {
          loss_dataset = loss_dataset.sort((a, b) => a - b);
          let remove_count = Math.floor(k / 4);
          loss_dataset = loss_dataset.splice(remove_count);
          avg_loss_without_bigger_value = Math.round(
            loss_dataset.reduce((a, b) => a + b) / loss_dataset.length
          );
        }
        expected_balance_dataset.data.push(last_end_balance);
        last_end_balance += avg_loss_without_bigger_value;
      }
    });
    expected_balance_dataset.data.push(last_end_balance);
    expected_balance_dataset.data = expected_balance_dataset.data.slice(1);
    const result = {
      labels: current.days.map((moment, idx) =>
        moment.format(
          moment.date() === 1 || idx === 0 ? `MM월 DD(ddd)` : `DD(ddd)`
        )
      ),
      datasets: [
        balance_dataset,
        {
          type: 'bar',
          order: 200,
          label: 'Loss',
          borderWidth: 1,
          pointRadius: 0,
          pointHitRadius: 15,
          xAxisID: 'x-axis-1',
          yAxisID: 'y-axis-1',
          borderColor: '#e3877780',
          backgroundColor: '#e3877780',
          fill: false,
          data: Object.values(current.dayStats)
            .filter((dayStat) => dayStat.moment < moment())
            .map((dayStat) =>
              dayStat.totalLoss === 0 ? NaN : -dayStat.totalLoss
            ),
        },
        {
          order: 0,
          label: 'deltaMoneyPerDay',
          borderWidth: 0,
          pointRadius: 0,
          pointHitRadius: 15,
          xAxisID: 'x-axis-1',
          yAxisID: 'y-axis-2',
          backgroundColor: '#87d387F0',
          data: Object.values(current.dayStats)
            .filter((dayStat) => dayStat.moment < moment())
            .map((dayStat) => dayStat.deltaMoneyPerDay),
        },
      ],
    };

    if (avg_loss_without_bigger_value !== null)
      result.datasets.push(expected_balance_dataset);

    return result;
  }

  render() {
    return (
      <>
        <Line
          data={(canvas) => this.getData(canvas)}
          options={{
            elements: {
              line: {
                tension: 0, // disables bezier curves
              },
            },
            legend: {
              labels: {
                fontSize:
                  Math.min(window.innerWidth, window.innerHeight) * 0.015,
              },
            },
            scales: {
              xAxes: [
                {
                  id: 'x-axis-1',
                  position: 'bottom',
                  ticks: {
                    maxTicksLimit: 32,
                    fontSize:
                      Math.min(window.innerWidth, window.innerHeight) * 0.015,
                  },
                  scaleLabel: {
                    display: false,
                  },
                },
                {
                  id: 'x-axis-2',
                  position: 'bottom',
                  ticks: {
                    maxTicksLimit: 5,
                    fontSize: 0,
                  },
                  gridLines: {
                    color: '#808080',
                    drawTicks: false,
                    drawBorder: false,
                    zeroLineColor: 'rgba(0,0,0,0)',
                    lineWidth: 1.2,
                  },
                  scaleLabel: {
                    display: true,
                  },
                  offset: false,
                  //grid: { display: false },
                  //gridLines: { drawBorder: false },
                },
              ],

              yAxes: [
                {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  id: 'y-axis-1',
                  ticks: {
                    min: 0,
                    stepSize: 50_0000,
                    autoSkip: false,
                    callback: (value) => formatKorean(value),
                    fontSize:
                      Math.min(window.innerWidth, window.innerHeight) * 0.015,
                  },
                  grid: { display: false },
                },
                {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  ticks: {
                    autoSkip: false,
                    callback: (value) => formatKorean(value),
                    fontSize:
                      Math.min(window.innerWidth, window.innerHeight) * 0.015,
                  },
                  id: 'y-axis-2',
                },
              ],
            },
            tooltips: {
              callbacks: {
                label: (e) => formatKorean(e.value),
              },
            },
            onClick: (model, item) => {
              if (item.length > 0)
                this.setState({
                  targetIndex: item[0]._index,
                });
            },
          }}
        />
        <div className='align-items-center d-flex flex-column'>
          {this.state.targetIndex !== undefined &&
            this.state.targetIndex <
              Object.values(this.props.current.dayStats).length && (
              <table>
                <thead>
                  {['시간', '메모', '잔액', '변액'].map((text) => (
                    <th children={text} className='border' />
                  ))}
                </thead>
                <tbody>
                  {(() => {
                    return Object.values(this.props.current.dayStats)[
                      this.state.targetIndex
                    ].transactions.map((tran) => (
                      <tr>
                        <td
                          children={moment(tran.timestamp).format('hh[:]mm')}
                          className='border'
                        />
                        <td children={tran.note} className='border' />
                        <td
                          children={formatKorean(tran.balance)}
                          className='border'
                        />
                        <td
                          children={format_curr(tran.delta)}
                          className='border'
                        />
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            )}
        </div>
      </>
    );
  }
}

export default MonthChart;
