import { cls_policies } from './cls_policies';
const dailyStatistic = (
  thisDay,
  allTransactions,
  paydays,
  yesterdayStatistic
) => {
  const thisDailyStatistic = {
    income: 0,
    loss: 0,
    delta: 0,
    balance: 0,
    maxBalance: 0,
    stackLoss: 0,
    salary: 0,
    leftDeposit: 0,
    trans: [],
  };
  const unorderedPieOfType = {};
  const pieOfType = {};

  allTransactions.forEach((tran) => {
    const YY_MM_DD = tran.datetime.format('YY-MM-DD');
    if (YY_MM_DD !== thisDay) return;
    if (tran.delta > 0) thisDailyStatistic.income += tran.delta;
    else thisDailyStatistic.loss -= tran.delta;
    if (tran.delta < 0)
      if (!(tran.tag in unorderedPieOfType))
        unorderedPieOfType[tran.tag] = -tran.delta;
      else unorderedPieOfType[tran.tag] -= tran.delta;
    thisDailyStatistic.delta += tran.delta;
    thisDailyStatistic.balance = tran.balance;
    thisDailyStatistic.maxBalance = Math.max(
      thisDailyStatistic.maxBalance,
      thisDailyStatistic.balance
    );
    thisDailyStatistic.trans.push(tran);
  });
  Object.keys(unorderedPieOfType)
    .sort((lhs, rhs) => {
      return unorderedPieOfType[lhs] - unorderedPieOfType[rhs];
    })
    .forEach((key) => {
      pieOfType[key] = unorderedPieOfType[key];
    });
  thisDailyStatistic.pieLabels = Object.keys(pieOfType).map((key) =>
    key.substr(1)
  );
  thisDailyStatistic.pieData = Object.values(pieOfType);
  thisDailyStatistic.pieBgColors = Object.keys(pieOfType).map((tag) => {
    return cls_policies.loss[tag.substr(1)].bgcolor;
  });

  if (paydays[thisDay] !== undefined || yesterdayStatistic === null) {
    thisDailyStatistic.salary = thisDailyStatistic.maxBalance;
    thisDailyStatistic.stackLoss = thisDailyStatistic.loss;
  } else {
    thisDailyStatistic.stackLoss =
      yesterdayStatistic.stackLoss - thisDailyStatistic.delta;
    thisDailyStatistic.salary = yesterdayStatistic.salary;
  }
  thisDailyStatistic.leftDeposit =
    thisDailyStatistic.salary - thisDailyStatistic.stackLoss;

  return thisDailyStatistic;
};

export default dailyStatistic;
