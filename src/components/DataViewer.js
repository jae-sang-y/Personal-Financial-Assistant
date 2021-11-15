import React, { Component } from "react";

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { FirebaseDatabaseNode } from "@react-firebase/database";

import { Button, ButtonGroup } from "react-bootstrap";
import {
  Cell,
  number_format,
  format_curr,
  format_timestamp,
} from "./DataViewer.style";
import ReceiptEditor from "./ReceiptEditor";
import moment from "moment";

const ReceiptButton = (props) => {
  return (
    <Button
      className="p-0"
      variant={
        props.children === undefined
          ? props.tran.tag === "변동지출"
            ? "danger"
            : "outline-secondary"
          : "outline-primary"
      }
      size="sm"
      children={props.children === undefined ? "추가" : "영수증"}
      onClick={() =>
        props.setReceipt({
          tran: props.tran,
          content: props.children || [],
        })
      }
    />
  );
};

const TransactionOnTable = ({ data, updateTran, targetYM, setReceipt }) => {
  return data.value === null ? (
    "There are no tracsactions"
  ) : (
    <div
      className="border-bottom border-top"
      style={{ maxHeight: "calc(100vh - 20rem)", overflowY: "auto" }}
    >
      <table
        className={{
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th children="시간" className="border text-monospace" />
            <th children="잔액" className="border text-monospace" />
            <th children="변동" className="border text-monospace" />
            <th children="노트" className="border text-monospace" />
            <th children="태그" className="border text-monospace" />
            <th
              children="영수증"
              className="border text-monospace"
              style={{ width: "5rem" }}
            />
          </tr>
        </thead>
        <tbody>
          {Object.values(data.value || {}).map((tran, row_k) => (
            <tr style={{ height: "1rem" }} key={row_k}>
              {[
                [Cell.timestmap, format_timestamp(tran.timestamp)],
                [Cell.balance, number_format.format(tran.balance)],
                [Cell.delta, format_curr(tran.delta)],
                [Cell.note, tran.note],
                [
                  Cell.tag,
                  <Button
                    children={tran.tag || "추가"}
                    className="p-0 m-0"
                    size="sm"
                    variant={
                      tran.tag === undefined ? "outline-danger" : "secondary"
                    }
                    onClick={() => {
                      const result = prompt("태그 바꾸기", tran.tag);
                      if (result !== null) {
                        updateTran(Object.assign(tran, { tag: result }));
                      }
                    }}
                  />,
                ],
              ].map(([Com, content], td_idx) => (
                <td
                  key={td_idx}
                  children={<Com children={content} pk={tran.timestamp} />}
                  className="border"
                />
              ))}
              <td
                children={
                  <ReceiptButton
                    children={tran.receipt}
                    pk={tran.timestamp}
                    tran={tran}
                    setReceipt={setReceipt}
                  />
                }
                className="border"
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

class DataViewer extends Component {
  state = {
    targetYM: moment().format("YYYY-MM"),
    tranOnMonth: {},
    receipt: null,
  };
  YmButtonOnClick(ym, e) {
    this.setState({ targetYM: ym });
  }

  updateTran(new_tran) {
    if (new_tran.YYYY_MM !== this.state.targetYM) throw new_tran;
    const query = {
      path: `transactions/${new_tran.YYYY_MM}/${new_tran.timestamp}`,
      value: new_tran,
      type: "update",
    };
    const ref = firebase.app().database().ref(query.path);
    ref.update(query.value);
  }

  render() {
    return (
      <div>
        <FirebaseDatabaseNode
          path="month_of_transactions/"
          children={(d) => (
            <ButtonGroup toggle className="my-3">
              <Button size="sm" children="조회연월" variant="outline-dark" />
              {d.value &&
                Object.entries(d.value).map(([ym]) => (
                  <Button
                    key={ym}
                    size="sm"
                    variant="outline-dark"
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
          <div className="w-100 d-flex flex-column align-items-center ">
            <FirebaseDatabaseNode
              path={`transactions/${this.state.targetYM}`}
              orderByKey={true}
              children={(d) => (
                <TransactionOnTable
                  data={d}
                  updateTran={(d) => this.updateTran(d)}
                  setReceipt={(receipt) => this.setState({ receipt: receipt })}
                  targetYM={this.state.targetYM}
                />
              )}
            />
          </div>
        )}
        <ReceiptEditor
          receipt={this.state.receipt}
          show={this.state.receipt !== null}
          onHide={() => this.setState({ receipt: null })}
        />
      </div>
    );
  }
}

export default DataViewer;
