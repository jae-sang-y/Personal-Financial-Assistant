import React from 'react';
import styled from 'styled-components';

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

export { Cell };
