import React, { Component } from "react";
import { formatKorean, format_curr } from "./DataViewer.style";

function DayBlock({ col_id, cell_id, current, setSelectedDayStat }) {
  let today = null;
  let todayStat = null;
  let todayKey = null;
  if (cell_id >= 0 && cell_id < current.days.length) {
    today = current.days[cell_id];
    todayKey = today.format("MM-DD");
    todayStat = current.dayStats[todayKey];
  }
  const text_type = () => {
    if (col_id === 5) return "text-primary";
    else if (col_id === 6) return "text-danger";
    else return "text-dark";
  };
  return (
    <div
      className={"p-0 " + (today && "border")}
      style={{
        width: "10vw",
        height: "10vw",
        cursor: today ? "pointer" : "auto",
      }}
    >
      {today && (
        <div
          className="d-flex flex-column h-100 pb-2"
          onClick={() =>
            setSelectedDayStat({
              transactions: todayStat.transactions,
            })
          }
        >
          <span
            className={"text-right mb-auto " + text_type()}
            children={
              today.date() === 1 ? today.format("M월 D일") : today.date()
            }
          />
          <span
            className="text-right text-success"
            style={{ fontSize: "1.5vmin" }}
            children={formatKorean(todayStat.endBalance)}
          />
          <span
            className="text-right text-danger"
            style={{ fontSize: "1.5vmin" }}
            children={formatKorean(todayStat.totalLoss)}
          />
        </div>
      )}
    </div>
  );
}

class MonthCalendar extends Component {
  state = {
    selectedDayStat: null,
  };
  render() {
    if (this.props.current.days.length === 0) return "No available days";
    const start_index = (7 - 1 + this.props.current.days[0].weekday()) % 7;
    return (
      <div className="mx-auto">
        <div className="mt-3">
          {[0, 1, 2, 3, 4, 5].map((row_id) => (
            <div className="d-flex flex-row">
              {[0, 1, 2, 3, 4, 5, 6].map((col_id) => (
                <DayBlock
                  col_id={col_id}
                  cell_id={col_id + row_id * 7 - start_index}
                  current={this.props.current}
                  setSelectedDayStat={(stat) => {
                    console.log(stat);
                    this.setState({ selectedDayStat: Object.assign({}, stat) });
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {this.state.selectedDayStat && (
          <table className="mx-auto mt-2">
            <thead>
              <th children="노트" className="border" />
              <th children="태그" className="border" />
              <th children="변액" className="border" />
              <th children="시간" className="border" />
            </thead>
            <tbody>
              {this.state.selectedDayStat.transactions.map((tran) => (
                <tr>
                  <td children={tran.note} className="border" />
                  <td children={tran.tag} className="border" />
                  <td children={format_curr(tran.delta)} className="border" />
                  <td children={tran.timestamp} className="border" />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
}

export default MonthCalendar;
