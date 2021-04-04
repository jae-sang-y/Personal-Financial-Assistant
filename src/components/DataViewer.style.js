import styled from 'styled-components';
import moment from 'moment';

const Cell = {
  timestmap: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 8.2rem;
    text-align: right !important;
  `,
  balance: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 5rem;
    text-align: right !important;
  `,
  delta: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 5rem;
    text-align: right !important;
  `,
  note: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 8rem;
  `,
  protocol: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 4rem;
  `,
  tag: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 4rem;
  `,
};

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

export { Cell, number_format, format_curr, format_timestamp };
