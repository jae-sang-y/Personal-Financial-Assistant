import { req } from './common';

import { TextDecoder } from 'text-encoding';
const text_decoder_for_euc_kr = new TextDecoder('EUC-KR');

const get_test_data = async () => {
  const data = await req('mydata.txt', 'buffer');
  return text_decoder_for_euc_kr.decode(data);
};

export { get_test_data };
