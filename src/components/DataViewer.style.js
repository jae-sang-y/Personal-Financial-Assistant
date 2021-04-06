import styled from 'styled-components';
import moment from 'moment';

const Cell = {
  timestmap: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;

    text-align: right !important;
  `,
  balance: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;

    text-align: right !important;
  `,
  delta: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;

    text-align: right !important;
  `,
  note: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
  `,
  protocol: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
  `,
  tag: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
  `,
};

const delta_number_format = new Intl.NumberFormat('ko-KR', {
  style: 'decimal',
});
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
  return time.format('MM[/]DD[(]ddd[)] HH[:]mm[:]ss');
};

moment.updateLocale('kr', {
  weekdaysShort: ['일', '월', '화', '수', '목', '금', '토'],
});

const formatKorean = (number) => {
  const sign = number < 0 ? '-' : '';
  let absNumber = Math.abs(number);
  let result = sign;
  if (absNumber === 0) return '0원';
  if (absNumber >= 1_0000) {
    const k = Math.floor(absNumber / 1_0000);
    result += k + '만';
    absNumber -= k * 1_0000;
  }
  if (absNumber > 0) result += absNumber;
  return result + '원';
};

export { Cell, number_format, format_curr, format_timestamp, formatKorean };
