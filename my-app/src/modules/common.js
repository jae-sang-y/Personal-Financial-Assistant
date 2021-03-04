import moment from 'moment';

import { cls_policies } from './cls_policies';

async function req(url, type) {
  let response = await fetch(url);
  if (response.status !== 200 && response.ok) throw response;

  if (type === undefined) return await response.json();
  if (type === 'text') return await response.text();
  if (type === 'buffer') return await response.arrayBuffer();
  throw type;
}

const dgb_bank_timestamp_to_moment = (timestamp) => {
  const datetime = {
    y: parseInt(timestamp.substr(0, 4)),
    M: parseInt(timestamp.substr(5, 2)) - 1,
    d: parseInt(timestamp.substr(8, 2)),
    h: parseInt(timestamp.substr(12, 2)),
    m: parseInt(timestamp.substr(15, 2)),
    s: parseInt(timestamp.substr(18, 2)),
  };
  const result = moment(datetime);

  if (result === null || !result.isValid()) {
    console.log(timestamp, datetime, result);
  }
  return result;
};

const build_transaction = (cells) => {
  const datetime = dgb_bank_timestamp_to_moment(cells[1]);

  const loss = parseInt(cells[3].replace(/,/g, ''));
  const income = parseInt(cells[4].replace(/,/g, ''));
  if (loss > 0 && income > 0) throw cells;
  const delta = income - loss;
  const note = cells[6];

  let define_tag = false;
  let tag = (delta > 0 ? 'I' : 'L') + 'other';

  const date = datetime.format('YYYY-MM-DD');
  const time = datetime.format('HH:mm:ss');

  for (const exc_datetime in cls_policies.exceptions) {
    if (
      exc_datetime.substr(0, 10) === date &&
      exc_datetime.substr(11, 8) === time
    ) {
      tag = cls_policies.exceptions[exc_datetime];
      define_tag = true;
      break;
    }
  }
  if (!define_tag) {
    if (delta > 0) {
      for (const cls_policy_name in cls_policies.income) {
        const cls_policy = cls_policies.income[cls_policy_name];
        if (cls_policy.filters !== undefined) {
          for (const password of cls_policy.filters) {
            if (password === note) {
              tag = 'I' + cls_policy_name;
              define_tag = true;
              break;
            }
          }
        }
        if (define_tag) break;
        if (cls_policy.regexs !== undefined) {
          for (const regex of cls_policy.regexs) {
            if (regex.test(note)) {
              tag = 'I' + cls_policy_name;
              define_tag = true;
              break;
            }
          }
        }
        if (define_tag) break;
      }
    } else if (delta < 0) {
      for (const cls_policy_name in cls_policies.loss) {
        const cls_policy = cls_policies.loss[cls_policy_name];
        if (cls_policy.filters !== undefined) {
          for (const password of cls_policy.filters) {
            if (password === note) {
              tag = 'L' + cls_policy_name;
              define_tag = true;
              break;
            }
          }
        }
        if (define_tag) break;
        if (cls_policy.regexs !== undefined) {
          for (const regex of cls_policy.regexs) {
            if (regex.test(note)) {
              tag = 'L' + cls_policy_name;
              define_tag = true;
              break;
            }
          }
        }
        if (define_tag) break;
      }
    }
  }

  const result = {
    datetime: datetime,
    delta: delta,
    balance: parseInt(cells[5].replace(/,/g, '')),
    note: note,
    tag: tag,
    timestamp: `${date} ${time}`,
  };

  if (define_tag) return result;
  else if (delta === 0 && cells[2] === '대체' /* Nothing */);
  else if (Math.abs(delta) >= 10) {
    const tran_type = cells[2];
    if (tran_type === 'C/D' || tran_type === 'CD공동')
      result.tag = (delta > 0 ? 'I' : 'L') + 'ATM';
    else console.log('Classification failed', note, delta, date, time, cells);
    return result;
  }
  return undefined;
};

const get_payday = (year, month) => {
  const promise_payday = 21;
  const someday = moment({ y: year, M: month - 1, d: promise_payday });
  while (someday.isoWeekday() >= 6) {
    someday.subtract(1, 'days');
  }
  return someday;
};

const get_payday_month = (YY_MM) => {
  const year = 2000 + parseInt(YY_MM.substr(0, 2));
  const month = parseInt(YY_MM.substr(3, 2));
  let next_year = year;
  let next_month = month + 1;
  if (next_month > 12) {
    next_month = 1;
    next_year += 1;
  }
  return {
    begin: get_payday(year, month).format('YYYY-MM-DD'),
    end: get_payday(next_year, next_month)
      .subtract(1, 'days')
      .format('YYYY-MM-DD'),
  };
};

const available_dates = [];
{
  let year = 2020;
  let month = 10;
  const now = moment();
  do {
    available_dates.push({
      y: year,
      m: month,
      YY_MM: moment({
        y: year,
        M: month - 1,
      }).format('YY-MM'),
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  } while (
    moment(`${year}-${month}-${get_payday(year, month).format('DD')}`).isBefore(
      now
    )
  );
}

const get_available_dates = () => available_dates;
const get_lastest_YY_MM = () => {
  const lastest_date = available_dates[available_dates.length - 1];
  return moment({ y: lastest_date.y, M: lastest_date.m - 1 }).format('YY-MM');
};

const intl_deposit = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});
const intl_deposit_00 = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const intl_delta = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const formatAsIncome = (num) => (
  <span children={intl_deposit.format(num)} className='text-success' />
);
const formatAsLoss = (num) => (
  <span children={intl_deposit.format(num)} className='text-danger' />
);
const formatAsDeposit = (num) => intl_deposit.format(num);
const formatAsIncome_00 = (num) => (
  <span children={intl_deposit_00.format(num)} className='text-success' />
);
const formatAsLoss_00 = (num) => (
  <span children={intl_deposit_00.format(num)} className='text-danger' />
);
const formatAsDelta = (num) => {
  if (num > 0)
    return (
      <span children={'▲' + intl_delta.format(num)} className='text-success' />
    );
  else
    return (
      <span children={'▼' + intl_delta.format(-num)} className='text-danger' />
    );
};

export {
  req,
  build_transaction,
  get_available_dates,
  get_payday_month,
  get_lastest_YY_MM,
  formatAsIncome,
  formatAsLoss,
  formatAsIncome_00,
  formatAsLoss_00,
  formatAsDelta,
  formatAsDeposit,
};
