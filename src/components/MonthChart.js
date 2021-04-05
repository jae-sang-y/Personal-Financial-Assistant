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

    return {
      labels: current.days.map((moment, idx) =>
        moment.format(
          moment.date() === 1 || idx === 0 ? `MM월 DD(ddd)` : `DD(ddd)`
        )
      ),
      datasets: [
        {
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
          data: Object.values(current.dayStats)
            .filter((dayStat) => dayStat.moment < moment())
            .map((dayStat) => dayStat.endBalance),
        },
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
            scales: {
              xAxes: [
                {
                  id: 'x-axis-1',
                  ticks: { autoSkip: false },
                  grid: { display: false },
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
