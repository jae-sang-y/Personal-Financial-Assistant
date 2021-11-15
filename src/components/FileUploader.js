import React, { Component } from "react";

import "firebase/auth";
import "firebase/database";
import {
  FirebaseDatabaseNode,
  FirebaseDatabaseMutation,
} from "@react-firebase/database";
import { TextDecoder } from "text-encoding";
import { Modal } from "react-bootstrap";

class FileUploader extends Component {
  state = {
    tranOnMonth: {},
    monthOfTran: {},
    tags: {},
  };
  regex_cache = {};
  constructor(props) {
    super(props);
    this.set_tranOnMonth = null;
    this.set_monthOfTran = null;
  }

  updateTranOnMonth(d) {
    const new_obj = d.value || {};
    if (JSON.stringify(new_obj) !== JSON.stringify(this.state.tranOnMonth))
      this.setState({ tranOnMonth: new_obj });
    return "";
  }
  updateMonthOfTran(d) {
    const new_obj = d.value || {};
    if (JSON.stringify(new_obj) !== JSON.stringify(this.state.monthOfTran))
      this.setState({ monthOfTran: new_obj });
    return "";
  }

  getFitTag(note) {
    const tag_entries = Object.entries(this.state.tags);
    let tag = null;
    for (let k = 0; k < tag_entries.length && tag === null; ++k) {
      const tag_entry = tag_entries[k];
      if (tag_entry[1].filters !== undefined) {
        for (const filter of tag_entry[1].filters) {
          if (filter.type === "키워드") {
            if (filter.value === note) {
              tag = tag_entry[0];
              break;
            }
          } else if (filter.type === "정규식") {
            if (!(filter.value in this.regex_cache)) {
              this.regex_cache[filter.value] = new RegExp(filter.value);
            }
            if (this.regex_cache[filter.value].test(note)) {
              tag = tag_entry[0];
              break;
            }
          }
        }
      }
    }
    return tag;
  }

  async uploadFile(e) {
    const text_decoder_for_euc_kr = new TextDecoder("EUC-KR");

    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = text_decoder_for_euc_kr.decode(e.target.result);
      const lines = text.split("\n");
      let k = 0;
      const data = [];

      for (const line of lines) {
        if (k > 0 && k < lines.length - 1) {
          const cells = line.split("|");
          data.push({
            YYYY_MM: cells[1].substr(0, 7),
            timestamp: cells[1]
              .replace(/\[/g, "")
              .replace(/\]/g, "")
              .replace(/,/g, ""),
            type: cells[2],
            delta:
              parseInt(cells[4].replace(/,/g, "")) -
              parseInt(cells[3].replace(/,/g, "")),
            balance: parseInt(cells[5].replace(/,/g, "")),
            note: cells[6],
            memo: cells[7],
            tag: this.getFitTag(cells[6]),
            receipt: null,
          });
        }
        k += 1;
      }
      const new_tranOnMonth = Object.assign({}, this.state.tranOnMonth || {});
      const new_monthOfTran = {};
      for (const tran of data) {
        if (tran.YYYY_MM.length === 0) continue;

        if (!(tran.YYYY_MM in new_monthOfTran))
          new_monthOfTran[tran.YYYY_MM] = 0;
        if (!(tran.YYYY_MM in new_tranOnMonth))
          new_tranOnMonth[tran.YYYY_MM] = {};
        if (!(tran.timestamp in new_tranOnMonth[tran.YYYY_MM])) {
          new_tranOnMonth[tran.YYYY_MM][tran.timestamp] = tran;
          new_monthOfTran[tran.YYYY_MM] += 1;
        }
      }
      await this.set_tranOnMonth(new_tranOnMonth);
      await this.set_monthOfTran(new_monthOfTran);
      this.props.onHide();
    };
    reader.readAsArrayBuffer(e.target.files[0]);
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title children="거래내역 업로드하기" />
        </Modal.Header>
        <div className="form-control">
          <FirebaseDatabaseNode
            path="tags/"
            children={(d) => {
              if (
                d.value !== null &&
                JSON.stringify(this.state.tags) !== JSON.stringify(d.value)
              )
                this.setState({ tags: d.value });
              return "";
            }}
          />
          <input
            type="file"
            onChange={(e) => this.uploadFile(e)}
            id="fileUploader"
            style={{ height: "30rem" }}
          />
          <FirebaseDatabaseNode
            path="transactions/"
            children={(d) => this.updateTranOnMonth(d)}
          />
          <FirebaseDatabaseNode
            path="month_of_transactions/"
            children={(d) => this.updateMonthOfTran(d)}
          />
          <FirebaseDatabaseMutation
            type="set"
            path="transactions"
            children={({ runMutation }) => {
              this.set_tranOnMonth = runMutation;
              return "";
            }}
          />
          <FirebaseDatabaseMutation
            type="set"
            path="month_of_transactions"
            children={({ runMutation }) => {
              this.set_monthOfTran = runMutation;
              return "";
            }}
          />
        </div>
        <Modal.Footer />
      </Modal>
    );
  }
}

export default FileUploader;
