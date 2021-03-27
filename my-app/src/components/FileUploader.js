import { Component } from 'react';

import 'firebase/auth';
import 'firebase/database';
import { IfFirebaseAuthed } from '@react-firebase/auth';
import {
  FirebaseDatabaseNode,
  FirebaseDatabaseMutation,
} from '@react-firebase/database';
import { TextDecoder } from 'text-encoding';

class FileUploader extends Component {
  state = {
    tranOnMonth: {},
    monthOfTran: {},
  };
  constructor(props) {
    super(props);
    this.set_tranOnMonth = null;
    this.set_monthOfTran = null;
  }

  updateTranOnMonth(d) {
    const new_obj = d.value || {};
    if (JSON.stringify(new_obj) !== JSON.stringify(this.state.tranOnMonth))
      this.setState({ tranOnMonth: new_obj });
    return '';
  }
  updateMonthOfTran(d) {
    const new_obj = d.value || {};
    if (JSON.stringify(new_obj) !== JSON.stringify(this.state.monthOfTran))
      this.setState({ monthOfTran: new_obj });
    return '';
  }

  async uploadFile(e) {
    const text_decoder_for_euc_kr = new TextDecoder('EUC-KR');

    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = text_decoder_for_euc_kr.decode(e.target.result);
      const lines = text.split('\n');
      let k = 0;
      const data = [];

      for (const line of lines) {
        if (k > 0 && k < lines.length - 1) {
          const cells = line.split('|');
          data.push({
            YYYY_MM: cells[1].substr(0, 7),
            timestamp: cells[1].replace(/[\[\], ]/g, ''),
            type: cells[2],
            delta:
              parseInt(cells[4].replace(/,/g, '')) -
              parseInt(cells[3].replace(/,/g, '')),
            balance: parseInt(cells[5].replace(/,/g, '')),
            note: cells[6],
            memo: cells[7],
          });
        }
        k += 1;
      }
      const new_tranOnMonth = Object.assign({}, this.state.tranOnMonth || {});
      const new_monthOfTran = {};
      for (const tran of data) {
        if (tran.YYYY_MM.length === 0) continue;
        if (!(tran.YYYY_MM in new_tranOnMonth))
          new_tranOnMonth[tran.YYYY_MM] = {};
        if (!(tran.YYYY_MM in new_monthOfTran))
          new_monthOfTran[tran.YYYY_MM] = 0;
        new_tranOnMonth[tran.YYYY_MM][tran.timestamp] = tran;
        new_monthOfTran[tran.YYYY_MM] += 1;
      }
      await this.set_tranOnMonth(new_tranOnMonth);
      await this.set_monthOfTran(new_monthOfTran);
    };
    reader.readAsArrayBuffer(e.target.files[0]);
  }

  render() {
    return (
      <div>
        <IfFirebaseAuthed>
          <input type='file' onChange={(e) => this.uploadFile(e)} />
          <FirebaseDatabaseNode
            path='transactions/'
            children={(d) => this.updateTranOnMonth(d)}
          />
          <FirebaseDatabaseNode
            path='month_of_transactions/'
            children={(d) => this.updateMonthOfTran(d)}
          />
          <FirebaseDatabaseMutation
            type='set'
            path='transactions'
            children={({ runMutation }) => {
              this.set_tranOnMonth = runMutation;
              return '';
            }}
          />
          <FirebaseDatabaseMutation
            type='set'
            path='month_of_transactions'
            children={({ runMutation }) => {
              this.set_monthOfTran = runMutation;
              return '';
            }}
          />
        </IfFirebaseAuthed>
      </div>
    );
  }
}

export default FileUploader;
