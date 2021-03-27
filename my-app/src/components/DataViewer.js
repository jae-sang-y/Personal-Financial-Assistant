import { Component } from 'react';

import 'firebase/auth';
import 'firebase/database';
import { IfFirebaseAuthed } from '@react-firebase/auth';
import { FirebaseDatabaseNode } from '@react-firebase/database';

import { Button, ButtonGroup, Container } from 'react-bootstrap';
import { Cell } from './DataViewer.style';
import moment from 'moment';

const TransactionOnTable = ({ data }) => {
  const number_format = new Intl.NumberFormat('ko-KR', {
    signDisplay: 'never',
    style: 'decimal',
  });
  const format_curr = (num) => {
    let str = number_format.format(num);
    return (
      <div
        className={
          'd-flex text-right ' + (num >= 0 ? 'text-black' : 'text-danger')
        }
      >
        <span className='mr-auto' children={num >= '0' ? '' : '-'} />
        <span children={str} />
      </div>
    );
  };

  const format_timestamp = (old_timestamp) => {
    const time = moment(old_timestamp, 'YYYY-MM-DDHH:mm:ss');
    if (!time.isValid()) return 'Not Valid';
    return time.format('MM-DD HH/mm/ss ddd');
  };

  return data.value === null ? (
    'There are no tracsactions'
  ) : (
    <table
      className={{
        tableLayout: 'fixed',
      }}
    >
      <thead>
        <tr>
          <th children='시간' className='border' />
          <th children='잔액' className='border' />
          <th children='변동' className='border' />
          <th children='노트' className='border' />
          <th children='매체' className='border' />
        </tr>
      </thead>
      <tbody>
        {Object.values(data.value).map((tran, row_k) => (
          <tr style={{ height: '1rem' }} key={row_k}>
            {[
              [Cell.timestmap, format_timestamp(tran.timestamp)],
              [Cell.balance, number_format.format(tran.balance)],
              [Cell.delta, format_curr(tran.delta)],
              [Cell.note, tran.note],
              [Cell.protocol, tran.protocol],
            ].map(([Com, content]) => (
              <td children={<Com children={content} />} className='border' />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

class DataViewer extends Component {
  state = {
    targetYM: '2021-02',
    tranOnMonth: {},
  };
  constructor(props) {
    super(props);
  }

  YmButtonOnClick(ym, e) {
    this.setState({ targetYM: ym });
  }

  render() {
    return (
      <div>
        <IfFirebaseAuthed>
          <FirebaseDatabaseNode
            path='month_of_transactions/'
            children={(d) => (
              <ButtonGroup toggle>
                <>
                  {d.value &&
                    Object.entries(d.value).map(([ym]) => (
                      <Button
                        size='sm'
                        children={ym}
                        onClick={this.YmButtonOnClick.bind(this, ym)}
                      />
                    ))}
                </>
              </ButtonGroup>
            )}
          />
          <br />
          {this.state.targetYM === null ? (
            <>Please select taget date</>
          ) : (
            <div className='w-100 d-flex flex-column align-items-center'>
              <h3 children={`${this.state.targetYM} 내역`} />
              <br />
              <FirebaseDatabaseNode
                path={`transactions/${this.state.targetYM}`}
                children={(d) => <TransactionOnTable data={d} />}
              />
            </div>
          )}
        </IfFirebaseAuthed>
      </div>
    );
  }
}

export default DataViewer;
