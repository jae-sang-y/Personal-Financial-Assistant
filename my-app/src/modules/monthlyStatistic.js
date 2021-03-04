import moment from 'moment';
import { cls_policies } from './cls_policies';
import { get_payday_month } from './common';

const monthlyStatistic = (availableDate, allTransactions) => {
  const thisMonthStatistics = {};
  thisMonthStatistics.span = get_payday_month(availableDate.YY_MM);
  thisMonthStatistics.transactions = allTransactions.filter((tran) =>
    tran.datetime.isBetween(
      thisMonthStatistics.span.begin,
      thisMonthStatistics.span.end
    )
  );

  {
    thisMonthStatistics.availableDays = [];
    let iterator_day = moment(thisMonthStatistics.span.begin, 'YYYY-MM-DD');
    const end_iterator_day = moment(thisMonthStatistics.span.end, 'YYYY-MM-DD');
    while (true) {
      thisMonthStatistics.availableDays.push(iterator_day.format('YY-MM-DD'));
      if (
        iterator_day.isSameOrAfter(end_iterator_day) ||
        iterator_day.isSameOrAfter(moment())
      )
        break;
      iterator_day.add(1, 'days');
    }
  }

  thisMonthStatistics.span.text = `from ${thisMonthStatistics.span.begin}  to ${thisMonthStatistics.span.end}`;

  thisMonthStatistics.sumOfLoss = 0;
  thisMonthStatistics.sumOfIncome = 0;
  thisMonthStatistics.unorderedPieOfType = {};
  thisMonthStatistics.pieOfType = {};
  thisMonthStatistics.startDay = null;
  thisMonthStatistics.endDay = null;

  const contentDays = {};
  thisMonthStatistics.transactions.forEach((tran) => {
    const YY_MM_DD = tran.datetime.format('YY-MM-DD');
    contentDays[YY_MM_DD] = true;
    if (!(tran.tag in thisMonthStatistics.unorderedPieOfType))
      thisMonthStatistics.unorderedPieOfType[tran.tag] = 0;
    thisMonthStatistics.unorderedPieOfType[tran.tag] += Math.abs(tran.delta);

    if (tran.delta > 0) thisMonthStatistics.sumOfIncome += tran.delta;
    else thisMonthStatistics.sumOfLoss -= tran.delta;

    if (thisMonthStatistics.startDay === null)
      thisMonthStatistics.startDay = YY_MM_DD;
    thisMonthStatistics.endDay = YY_MM_DD;
  });

  thisMonthStatistics.contentDays = Object.keys(contentDays);

  {
    thisMonthStatistics.startBalance =
      thisMonthStatistics.transactions[0].balance -
      thisMonthStatistics.transactions[0].delta;
    thisMonthStatistics.endBalance =
      thisMonthStatistics.transactions[
        thisMonthStatistics.transactions.length - 1
      ].balance;
    thisMonthStatistics.deltaBalance =
      thisMonthStatistics.endBalance - thisMonthStatistics.startBalance;
  }
  {
    thisMonthStatistics.leftDays =
      moment(thisMonthStatistics.span.end, 'YYYY-MM-DD').diff(
        moment(),
        'days'
      ) + 2;
    if (thisMonthStatistics.leftDays > 0) {
      thisMonthStatistics.targetDeltaToZero =
        thisMonthStatistics.endBalance / thisMonthStatistics.leftDays;
      thisMonthStatistics.targetDeltaToStart =
        thisMonthStatistics.deltaBalance / thisMonthStatistics.leftDays;
    } else {
      thisMonthStatistics.leftDays = 0;
      thisMonthStatistics.targetDeltaToZero = '-';
      thisMonthStatistics.targetDeltaToStart = '-';
    }
  }
  {
    thisMonthStatistics.daysOfMonth = moment(
      thisMonthStatistics.span.end,
      'YYYY-MM-DD'
    ).diff(moment(thisMonthStatistics.span.begin, 'YYYY-MM-DD'), 'days');
    thisMonthStatistics.lossByDay =
      thisMonthStatistics.sumOfLoss / thisMonthStatistics.daysOfMonth;
    thisMonthStatistics.incomeByDay =
      thisMonthStatistics.sumOfIncome / thisMonthStatistics.daysOfMonth;
    thisMonthStatistics.deltaByDay =
      thisMonthStatistics.deltaBalance / thisMonthStatistics.daysOfMonth;
  }

  Object.keys(thisMonthStatistics.unorderedPieOfType)
    .sort((lhs, rhs) => {
      const L =
        lhs[0] === 'I'
          ? thisMonthStatistics.unorderedPieOfType[lhs]
          : -thisMonthStatistics.unorderedPieOfType[lhs];
      const R =
        rhs[0] === 'I'
          ? thisMonthStatistics.unorderedPieOfType[rhs]
          : -thisMonthStatistics.unorderedPieOfType[rhs];
      return L - R;
    })
    .forEach((key) => {
      thisMonthStatistics.pieOfType[key] =
        thisMonthStatistics.unorderedPieOfType[key];
    });

  thisMonthStatistics.pieLabels = Object.keys(
    thisMonthStatistics.pieOfType
  ).map((key) => key.substr(1));
  thisMonthStatistics.pieData = Object.values(thisMonthStatistics.pieOfType);
  thisMonthStatistics.pieBgColors = Object.keys(
    thisMonthStatistics.pieOfType
  ).map((tag) => {
    if (tag[0] === 'I') return cls_policies.income[tag.substr(1)].bgcolor;
    else return cls_policies.loss[tag.substr(1)].bgcolor;
  });
  return thisMonthStatistics;
};

export default monthlyStatistic;
