import { Component } from 'react';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { FirebaseDatabaseNode } from '@react-firebase/database';

import { Button, ButtonGroup } from 'react-bootstrap';
import { Cell } from './DataViewer.style';
import moment from 'moment';

const ReceiptButton = (props) => {
  if (props.children === null)
    return (
      <Button
        className='p-0'
        variant='outline-secondary'
        size='sm'
        children='추가'
      />
    );
  return (
    <Button
      className='p-0'
      variant='outline-success'
      size='sm'
      children='보기'
    />
  );
};

const TransactionOnTable = ({ data, updateTran, targetYM }) => {
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
    return time
      .format('MM[/]DD[(]ddd[)] HH[:]mm[:]ss')
      .replace('Sun', '일')
      .replace('Mon', '월')
      .replace('Tue', '화')
      .replace('Wed', '수')
      .replace('Thu', '목')
      .replace('Fri', '금')
      .replace('Sat', '토');
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
          <th children='시간' className='border text-monospace' />
          <th children='잔액' className='border text-monospace' />
          <th children='변동' className='border text-monospace' />
          <th children='노트' className='border text-monospace' />
          <th children='태그' className='border text-monospace' />
          <th children='영수증' className='border text-monospace' />
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
              [
                Cell.tag,
                <Button
                  children={tran.tag || '추가'}
                  className='p-0 m-0'
                  size='sm'
                  variant={
                    tran.tag === undefined ? 'outline-danger' : 'secondary'
                  }
                  onClick={() => {
                    const result = prompt('태그 바꾸기', tran.tag);
                    if (result !== null) {
                      updateTran(Object.assign(tran, { tag: result }));
                    }
                  }}
                />,
              ],
              [ReceiptButton, null],
            ].map(([Com, content], td_idx) => (
              <td
                key={td_idx}
                children={<Com children={content} pk={tran.timestamp} />}
                className='border'
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

class DataViewer extends Component {
  state = {
    targetYM: moment().format('YYYY-MM'),
    tranOnMonth: {},
  };
  YmButtonOnClick(ym, e) {
    this.setState({ targetYM: ym });
  }

  updateTran(new_tran) {
    if (new_tran.YYYY_MM !== this.state.targetYM) throw new_tran;
    const query = {
      path: `transactions/${new_tran.YYYY_MM}/${new_tran.timestamp}`,
      value: new_tran,
      type: 'update',
    };
    const ref = firebase.app().database().ref(query.path);
    ref.update(query.value);
  }

  render() {
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
                    onClick={this.YmButtonOnClick.bind(this, ym)}
                  />
                ))}
            </ButtonGroup>
          )}
        />
        <br />
        {this.state.targetYM === null ? (
          <>Please select taget date</>
        ) : (
          <div className='w-100 d-flex flex-column align-items-center'>
            <FirebaseDatabaseNode
              path={`transactions/${this.state.targetYM}`}
              orderByKey={true}
              children={(d) => (
                <TransactionOnTable
                  data={d}
                  updateTran={(d) => this.updateTran(d)}
                  targetYM={this.state.targetYM}
                />
              )}
            />
          </div>
        )}
      </div>
    );
  }
}

export default DataViewer;
