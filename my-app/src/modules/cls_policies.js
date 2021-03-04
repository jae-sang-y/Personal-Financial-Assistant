const cls_policies = {
  income: {
    사적금전인수: { bgcolor: '#e0fcde' },
    캐쉬백: {
      filters: ['현금IC캐쉬백'],
    },
    급여: {
      bgcolor: '#095409',
      filters: [
        '급여변동상여',
        '(주)대구은행(인재개발부)',
        '급여연차보상금',
        '설고정상여금',
        '(주)대구은행',
      ],
    },
    상금: {
      bgcolor: '#138413',
      filters: ['우리(재)한국장학재단', '대구소프트웨'],
    },
    환불: {
      bgcolor: '#3f8413',
      regex_filters: [String.raw`한국철도공사        \S+`],
    },
    외화매도: {
      bgcolor: '#3f8413',
      filters: ['외화적립지급'],
    },
    자체수입: {
      bgcolor: '#468942',
      filters: ['농협윤재상', '신한윤재상', '체크카드캐쉬백', '비씨대금환급'],
    },
    ATM: { bgcolor: '#a2cc9f' },
    other: { bgcolor: '#e0fcde' },
  },
  loss: {
    정기지출: {
      bgcolor: '#490b02',
      filters: [
        '한화생명02045',
        'KT4333557702',
        '전기요금인터넷',
        '대성 김윤자',
        '아람머리방',
        'DL HAIR',
        '헤어아트#',
        '휴포레명품크리닝',
      ],
    },
    쇼핑: {
      bgcolor: '#c45d31',
      filters: [
        '11번가',
        '장미가구사',
        '천냥앤디씨',
        '롯데하이마트(주)',
        '롯데역사(주)대구',
        '옥션윤재상      ',
      ],
    },
    소비: {
      bgcolor: '#c4a631',
      regex_filters: [
        String.raw`(지에스|GS)25( 불로|드림병원|달서동화)점`,
        String.raw`씨유(대구불로대로|밀양무안점|수성롯데캐슬)?`,
        String.raw`(팔공)?(E-|이)마트(24 S대구은)?`,
      ],
      filters: [
        '대백마트 (불로)',
        'AM픽쳐스',
        '(주)코리아세븐달',
        '다이소대구이시',
      ],
    },
    놀이: {
      bgcolor: '#c4314e',
      filters: [
        '(주)마루홀딩스 3',
        '(주)글로벌스포츠',
        '앤유피씨(NU PC)',
        '캐슬PC',
        '제이와이',
      ],
    },
    여행: {
      bgcolor: '#8ec431',
      filters: [
        '(주)이비카드 택',
        '코레일유통(주)대',
        '(주)이비카드택시',
        '한국철도공사',
        '모바일 티머니 충',
        '(주)인터파크홀딩',
      ],
    },
    외식: {
      bgcolor: '#c4315f',
      filters: [
        '(주)신세계푸드',
        '한상바다',
        '진배기원조할매국',
        '할리스 봉무공원',
        '(주)난성/롯데리',
        '청도새마을휴게소',
        '버거킹 대구이시',
        '불로수산',
        '에우스타키오',
      ],
    },
    교육: {
      bgcolor: '#9831c4',
      filters: ['한국금융투자협회'],
    },
    외화매수: {
      bgcolor: '#7c1101',
      filters: ['윤재상(537101106'],
    },
    사적금전인도: {
      bgcolor: '#aa4444',
      regex: [String.raw`토스＿\S{3}`],
    },
    자체지출: {
      bgcolor: '#8e5f5f',
      filters: ['농협윤재상', '카카오페이　　　'],
    },
    수수료: {
      bgcolor: '#967b7b',
      regex_filters: [String.raw`\*{5} \d{4}년 \d{2}월 영플러스통장 수수료 면`],
      filters: ['공공기관', '법원행정처', 'OTP발급수수료', '현금카드발급'],
    },
    ATM: { bgcolor: '#e08888' },
    회비: { bgcolor: '#e0ccb8' },
    other: {
      bgcolor: '#e0b8b8',
    },
  },
  exceptions: {
    '2020-11-22 11:08:23': 'I사적금전인수',
    '2020-12-19 11:22:27': 'I사적금전인수',
    '2021-01-08 12:38:43': 'L회비',
    '2021-01-14 20:11:10': 'L놀이',
    '2021-01-19 11:58:01': 'L외화매수',
    '2021-01-20 23:03:34': 'L수수료',
    '2021-01-29 07:44:15': 'L교육',
    '2021-02-02 19:31:21': 'L교육',
    '2021-02-03 18:20:48': 'L사적금전인도',
    '2021-02-05 13:28:57': 'L외식',
    '2021-02-14 10:42:30': 'I상금',
    '2021-02-14 10:43:18': 'I상금',
    '2021-02-25 08:55:07': 'L소비',
  },
};

for (const cls_policy_name in cls_policies.loss) {
  const cls_policy = cls_policies.loss[cls_policy_name];
  if (cls_policy.regex_filters !== undefined)
    cls_policy.regexs = cls_policy.regex_filters.map(
      (regex_filter) => new RegExp(regex_filter)
    );
  cls_policies.loss[cls_policy_name] = cls_policy;
}
for (const cls_policy_name in cls_policies.income) {
  const cls_policy = cls_policies.income[cls_policy_name];
  if (cls_policy.regex_filters !== undefined)
    cls_policy.regexs = cls_policy.regex_filters.map(
      (regex_filter) => new RegExp(regex_filter)
    );
  cls_policies.income[cls_policy_name] = cls_policy;
}

export { cls_policies };
