import { Component } from 'react';

import firebase from 'firebase/app';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import { formatKorean } from './DataViewer.style';
import moment from 'moment';
import { Doughnut } from 'react-chartjs-2';

class DataAnalyzer extends Component {
  state = {
    target_yy: '21',
    target_mm: moment().format('MM'),
    target_tag: null,
    stats: null,
  };

  getColorFromName(name) {
    const base = 30;
    let x = 0;
    for (const idx in name) x += 32767000 / name.charCodeAt(idx);
    x %= 240;
    x /= 240;

    let r = 0;
    let g = 0;
    let b = 0;
    if (x > 0 / 3 && x < 2 / 3) r = Math.abs(1 / 3 - x);
    if (x > 1 / 3 && x < 3 / 3) g = Math.abs(2 / 3 - x);
    if (x > 2 / 3) b = Math.abs(3 / 3 - x);
    if (x < 1 / 3) b = Math.abs(0 / 3 - x);

    r *= 255 - base;
    g *= 255 - base;
    b *= 255 - base;
    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    r += base;
    g += base;
    b += base;

    if (name === 'undefined') {
      r = 255;
      g = 0;
      b = 255;
    }

    return `rgb(${r},${g},${b})`;
  }
  getStatsOfMonth(mm, trans) {
    const statByTag = {};
    const transByTag = {};
    const statByReciept = {};
    const statByFixedLoss = { value: 0 };

    Object.values(trans).forEach((tran) => {
      if (tran.delta < 0) {
        if (tran.tag === '고정지출') {
          statByFixedLoss.value += -tran.delta;
        }
        if (tran.receipt !== undefined) {
          tran.receipt.forEach(({ value, name, count }) => {
            if (!(name in statByReciept)) {
              statByReciept[name] = {
                count: 0,
                value: 0,
              };
            }

            statByReciept[name].count += Number(count);
            statByReciept[name].value += Number(value);
          });
        }

        if (!(tran.tag in statByTag)) {
          statByTag[tran.tag] = {
            count: 0,
            value: 0,
          };
          transByTag[tran.tag] = [];
        }
        statByTag[tran.tag].count += 1;
        statByTag[tran.tag].value += -tran.delta;
        transByTag[tran.tag].push({
          timestamp: moment(tran.timestamp).format('DD[일][(]ddd[)] HH[:]mm'),
          value: tran.delta,
          note: tran.note,
        });
      }
    });

    const sumOfStatByTag = Object.values(statByTag)
      .map((data) => data.value)
      .reduce((a, b) => a + b);
    const datasetOfStatByTag = {
      labels: Object.keys(statByTag),
      datasets: [
        {
          label: `Costs `,
          backgroundColor: Object.keys(statByTag).map((name) =>
            this.getColorFromName(name)
          ),
          data: Object.values(statByTag).map((data) => data.value),
        },
      ],
    };

    return {
      topListOfStatByTag: Object.entries(statByTag)
        .sort(([_0, a], [_1, b]) => b.value - a.value)
        .map(([K, V]) => K)
        .slice(0, 5)
        .map((tag) => {
          return {
            tag: tag,
            percent:
              Math.round((statByTag[tag].value / sumOfStatByTag) * 100) + '%',
            value: statByTag[tag].value,
          };
        }),
      transByTag: Object.fromEntries(
        Object.entries(transByTag).map(([K, V]) => {
          console.log(V);
          return [K, V.sort((a, b) => a.value - b.value)];
        })
      ),
      datasetOfStatByTag: datasetOfStatByTag,
      statByFixedLoss: statByFixedLoss,
      statByReciept: Object.fromEntries(
        Object.entries(statByReciept).sort(
          ([_0, a], [_1, b]) => b.value - a.value
        )
      ),
    };
  }

  componentDidMount() {
    const ref_transactions = firebase.app().database().ref('transactions/');
    ref_transactions.get().then((d) => {
      const trans_by_month = Object.entries(d.val()).filter(
        (e) => e[0].substr(2, 2) === this.state.target_yy
      );

      const newStats = {};
      trans_by_month.forEach(([mm, trans]) => {
        newStats[mm.substr(5, 2)] = this.getStatsOfMonth(mm, trans);
      });
      this.setState({
        stats: newStats,
      });
    });
  }

  renderStatByMonth(m) {
    const mm = (m < 10 ? '0' : '') + m.toString();

    let stat = null;
    if (this.state.stats !== null) {
      if (mm in this.state.stats) stat = this.state.stats[mm];
    }
    return (
      <Card
        className='border m-2'
        style={{ width: 'calc(25% - 1.5rem)' }}
        onClick={() => this.setState({ target_mm: mm })}
      >
        {`${m}월`}
        {stat === null ? (
          <div
            className='text-secondary my-auto pb-4'
            style={{ fontSize: '1.3vmin' }}
          >
            데이터 없음
          </div>
        ) : (
          <div>
            <table className='mx-auto mb-1 border rounded'>
              <tbody>
                {stat.topListOfStatByTag.map(({ tag, percent, value }) => {
                  return (
                    <tr>
                      <td className='border' style={{ fontSize: '1.3vmin' }}>
                        {tag}
                      </td>
                      <td className='border' style={{ fontSize: '1.3vmin' }}>
                        {`${percent}(${formatKorean(value)})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <table className='mx-auto mb-1 border rounded'>
              <tbody>
                {Object.entries(stat.statByReciept)
                  .slice(0, 3)
                  .map(([name, { value, count }]) => {
                    return (
                      <tr>
                        <td
                          className='border'
                          style={{ fontSize: '1.3vmin' }}
                        >{`${name}×${count}`}</td>
                        <td
                          className='border'
                          style={{ fontSize: '1.3vmin' }}
                        >{`${formatKorean(Math.round(value))}`}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <Card
              className='mx-3 mb-1 text-danger'
              style={{ fontSize: '1.3vmin' }}
            >
              {`고정지출: ${formatKorean(stat.statByFixedLoss.value)}`}
            </Card>
          </div>
        )}
      </Card>
    );
  }

  chartOnClick(e, items) {
    if (items.length > 0) {
      console.log(
        this.state.stats[this.state.target_mm].datasetOfStatByTag.labels[
          items[0]._index
        ]
      );
      this.setState({
        target_tag:
          this.state.stats[this.state.target_mm].datasetOfStatByTag.labels[
            items[0]._index
          ],
      });
    }
  }

  render() {
    return (
      <div className='d-flex mx-3 my-5 flex-column'>
        <h5 children={`${this.state.target_yy}년도 종합통계`} />
        <div className='d-flex align-content-between flex-wrap'>
          {[1, 2, 3, 4].map((m) => this.renderStatByMonth(m))}
          {[5, 6, 7, 8].map((m) => this.renderStatByMonth(m))}
          {[9, 10, 11, 12].map((m) => this.renderStatByMonth(m))}
        </div>

        {this.state.stats !== null &&
          this.state.stats[this.state.target_mm] !== undefined && (
            <div>
              <div style={{ minHeight: '80vmin' }}>
                <Doughnut
                  redraw={true}
                  options={{
                    title: {
                      display: true,
                      text: `${this.state.target_mm}월`,
                    },

                    tooltips: {
                      callbacks: {
                        label: (item, data, x, y, z) =>
                          data.labels[item.index] +
                          ' ' +
                          formatKorean(data.datasets[0].data[item.index]),
                      },
                    },
                  }}
                  data={
                    this.state.stats[this.state.target_mm].datasetOfStatByTag
                  }
                />
              </div>
              <div style={{ minHeight: '70vmin' }}>
                <ButtonGroup>
                  {this.state.stats[
                    this.state.target_mm
                  ].datasetOfStatByTag.labels.map((label) => (
                    <Button
                      children={label}
                      variant='outline-primary'
                      size='sm'
                      onClick={() => this.setState({ target_tag: label })}
                    />
                  ))}
                </ButtonGroup>
                {this.state.target_tag in
                  this.state.stats[this.state.target_mm].transByTag && (
                  <table className='mx-auto'>
                    <tbody>
                      {this.state.stats[this.state.target_mm].transByTag[
                        this.state.target_tag
                      ].map(({ timestamp, value, note }) => (
                        <tr>
                          <td className='border'>{timestamp}</td>
                          <td className='border'>{note}</td>
                          <td className='border text-danger'>
                            {formatKorean(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
      </div>
    );
  }
}

export default DataAnalyzer;
