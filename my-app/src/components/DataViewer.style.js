import React from 'react';
import styled from 'styled-components';

const Cell = {
  timestmap: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 10rem;
    text-align: right !important;
    font-variant-numeric: tabular-nums lining-nums;
  `,
  balance: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 5rem;
    text-align: right !important;
    font-variant-numeric: tabular-nums;
  `,
  delta: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 5rem;
    text-align: right !important;
    font-variant-numeric: tabular-nums;
  `,
  note: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 8rem;
    font-variant-numeric: tabular-nums;
  `,
  protocol: styled.span`
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 4rem;
    font-variant-numeric: tabular-nums;
  `,
};

export { Cell };
