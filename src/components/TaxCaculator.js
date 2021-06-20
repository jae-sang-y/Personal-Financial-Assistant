import { Component } from 'react';

import firebase from 'firebase/app';
import { formatKorean, format_curr } from './DataViewer.style';

class TaxCaculator extends Component {
  state = {
    target_yy: '21',
    pre_tax: [],
    pre_tax_sum_amt_real: NaN,
    pre_tax_sum_amt_exp: NaN,
    incomes: [],
    income_sum_amt_real: NaN,
    income_sum_amt_exp: NaN,
    card_loss: [],
    card_loss_sum_amt_real: NaN,
    card_loss_sum_amt_exp: NaN,
    transport_loss: [],
    transport_loss_sum_amt_real: NaN,
    transport_loss_sum_amt_exp: NaN,
    using_expected: false,
  };
  componentDidMount() {
    const ref_pre_taxs = firebase.app().database().ref('pre_taxs/');
    ref_pre_taxs.get().then((d) => {
      const pre_tax = Object.entries(d.val()).filter(
        ([YY_MM]) => YY_MM.substr(0, 2) === this.state.target_yy
      );
      let pre_tax_sum_amt_real = 0;
      let pre_tax_sum_amt_exp = NaN;

      const using_expected = pre_tax.length < 12;
      pre_tax.forEach(([YY_MM, pre_tax_of_month]) => {
        pre_tax_sum_amt_real += pre_tax_of_month.amount;
      });

      if (using_expected) {
        pre_tax_sum_amt_exp =
          pre_tax_sum_amt_real +
          ((12 - pre_tax.length) *
            (pre_tax[pre_tax.length - 1][1].amount +
              pre_tax[pre_tax.length - 2][1].amount)) /
            2;
      } else pre_tax_sum_amt_exp = pre_tax_sum_amt_real;

      this.setState({
        pre_tax: pre_tax,
        pre_tax_sum_amt_real: pre_tax_sum_amt_real,
        pre_tax_sum_amt_exp: pre_tax_sum_amt_exp,
      });
    });

    const ref_transactions = firebase.app().database().ref('transactions/');
    ref_transactions.get().then((d) => {
      const trans = Object.entries(d.val()).filter(
        (e) => e[0].substr(2, 2) === this.state.target_yy
      );
      const incomes = trans
        .map(([YYYY_MM, trans]) => {
          const incomes_in_month = Object.values(trans)
            .filter((tran) => tran.tag === '급여')
            .map((tran) => tran.delta);
          const income_amt =
            incomes_in_month.length > 0
              ? incomes_in_month.reduce((a, b) => a + b)
              : 0;
          return [YYYY_MM, income_amt];
        })
        .filter(([YYYY_MM, income_amt]) => income_amt > 0);

      let income_sum_amt_exp = NaN;
      let income_sum_amt_real = 0;
      const using_expected = incomes.length < 12;
      incomes.forEach(
        ([YYYY_MM, income_amt]) => (income_sum_amt_real += income_amt)
      );
      if (using_expected) {
        income_sum_amt_exp =
          income_sum_amt_real +
          ((12 - incomes.length) *
            (incomes[incomes.length - 1][1] + incomes[incomes.length - 2][1])) /
            2;
      } else income_sum_amt_exp = income_sum_amt_real;

      const card_loss = trans.map(([YYYY_MM, trans]) => {
        const loss_in_month = Object.values(trans)
          .filter((tran) => tran.type === 'BC')
          .map((tran) => tran.delta);
        const loss_amt =
          loss_in_month.length > 0 ? loss_in_month.reduce((a, b) => a + b) : 0;
        return [YYYY_MM, loss_amt];
      });
      let card_loss_sum_amt_exp = NaN;
      let card_loss_sum_amt_real = 0;
      card_loss.forEach(
        ([YYYY_MM, income_amt]) => (card_loss_sum_amt_real += income_amt)
      );
      if (using_expected) {
        card_loss_sum_amt_exp =
          card_loss_sum_amt_real +
          ((12 - card_loss.length) *
            (card_loss[card_loss.length - 1][1] +
              card_loss[card_loss.length - 2][1])) /
            2;
      } else card_loss_sum_amt_exp = card_loss_sum_amt_real;

      const transport_loss = trans.map(([YYYY_MM, trans]) => {
        const loss_in_month = Object.values(trans)
          .filter((tran) => tran.tag === '교통비')
          .map((tran) => tran.delta);
        const loss_amt =
          loss_in_month.length > 0 ? loss_in_month.reduce((a, b) => a + b) : 0;
        return [YYYY_MM, loss_amt];
      });
      let transport_loss_sum_amt_exp = NaN;
      let transport_loss_sum_amt_real = 0;
      transport_loss.forEach(
        ([YYYY_MM, loss_amt]) => (transport_loss_sum_amt_real += loss_amt)
      );
      if (using_expected) {
        transport_loss_sum_amt_exp =
          transport_loss_sum_amt_real +
          ((12 - transport_loss.length) *
            (transport_loss[transport_loss.length - 1][1] +
              transport_loss[transport_loss.length - 2][1])) /
            2;
      } else transport_loss_sum_amt_exp = transport_loss_sum_amt_real;

      this.setState({
        incomes: incomes,
        income_sum_amt_exp: income_sum_amt_exp,
        income_sum_amt_real: income_sum_amt_real,
        card_loss: card_loss,
        card_loss_sum_amt_exp: card_loss_sum_amt_exp,
        card_loss_sum_amt_real: card_loss_sum_amt_real,
        transport_loss: transport_loss,
        transport_loss_sum_amt_exp: transport_loss_sum_amt_exp,
        transport_loss_sum_amt_real: transport_loss_sum_amt_real,
        using_expected: using_expected,
      });
    });
  }

  getLaborIncomeDeduction() {
    const income_sum_amt = this.state.income_sum_amt_exp;
    const man = 1_0000;
    if (income_sum_amt <= 500 * man) return (income_sum_amt * 70) / 100;
    else if (income_sum_amt <= 1500 * man)
      return 350 * man + ((income_sum_amt - 500 * man) * 40) / 100;
    else if (income_sum_amt <= 4500 * man)
      return 750 * man + ((income_sum_amt - 1500 * man) * 15) / 100;
    else if (income_sum_amt <= 1_0000 * man)
      return 1200 * man + ((income_sum_amt - 4500 * man) * 5) / 100;
    else
      return Math.min(
        2000 * man,
        1475 + ((income_sum_amt - 1_0000 * man) * 2) / 100
      );
  }
  getTotalIncome() {
    return this.state.income_sum_amt_exp - this.getLaborIncomeDeduction();
  }
  getTotalDeduction() {
    return 150 * 10000;
  }
  getBaseTax() {
    return (
      this.getTotalIncome() -
      this.getTotalDeduction() -
      this.getCardDeduction() -
      this.getTransportDeduction()
    );
  }
  getCardDeduction() {
    let X =
      ((-this.state.card_loss_sum_amt_exp -
        (this.state.income_sum_amt_exp / 100) * 25) /
        100) *
      30;
    if (this.state.income_sum_amt_exp <= 7000 * 10000)
      X = Math.min(X, 300 * 10000, (this.state.income_sum_amt_exp / 100) * 20);
    else if (this.state.income_sum_amt_exp <= 12000 * 10000)
      X = Math.min(X, 250 * 10000);
    else X = Math.min(X, 200 * 10000);
    return Math.max(0, X);
  }
  getTransportDeduction() {
    return Math.max(0, (-this.state.transport_loss_sum_amt_exp / 100) * 40);
  }
  getSpecialDeduction() {
    return 13 * 10000;
  }

  getCaulatedTax() {
    const base_tax = this.getBaseTax();
    const man = 1_0000;
    if (base_tax <= 1200 * man) return 0.06 * base_tax;
    else if (base_tax <= 4600 * man)
      return 72 * man + 0.15 * (base_tax - 1200 * man);
    else if (base_tax <= 8800 * man)
      return 582 * man + 0.24 * (base_tax - 4600 * man);
    else if (base_tax <= 15000 * man)
      return 1590 * man + 0.35 * (base_tax - 8800 * man);
    else if (base_tax <= 30000 * man)
      return 3760 * man + 0.38 * (base_tax - 15000 * man);
    else if (base_tax <= 50000 * man)
      return 9460 * man + 0.4 * (base_tax - 30000 * man);
    else if (base_tax <= 100000 * man)
      return 17460 * man + 0.42 * (base_tax - 50000 * man);
    else return 38460 * man + 0.45 * (base_tax - 100000 * man);
  }

  getFinalDeduction() {
    return (
      this.getCaulatedTax() -
      this.state.pre_tax_sum_amt_exp -
      this.getSpecialDeduction()
    );
  }

  render() {
    const table_pre_tax = (
      <table className='m-3'>
        <tr>
          <th children='원천징수세액' className='border' colSpan='2' />
        </tr>
        {this.state.pre_tax.map(([YY_MM, { amount }]) => (
          <tr>
            <th children={'20' + YY_MM} className='border' />
            <td children={format_curr(amount)} className='border' />
          </tr>
        ))}
        <tr>
          <th children='원천징수액' className='border' />
          <td
            children={format_curr(this.state.pre_tax_sum_amt_real)}
            className='border'
          />
        </tr>
        {this.state.using_expected && (
          <tr>
            <th children='추정 원천징수액' className='border' />
            <td
              children={format_curr(this.state.pre_tax_sum_amt_exp)}
              className='border'
            />
          </tr>
        )}
      </table>
    );
    const table_card_loss = (
      <table className='m-3'>
        <tr>
          <th children='카드사용금액' className='border' colSpan='2' />
        </tr>
        {this.state.card_loss.map(([YYYY_MM, amount]) => (
          <tr>
            <th children={YYYY_MM} className='border' />
            <td children={format_curr(amount)} className='border' />
          </tr>
        ))}
        <tr>
          <th children='카드사용금액' className='border' />
          <td
            children={format_curr(this.state.card_loss_sum_amt_real)}
            className='border'
          />
        </tr>
        {this.state.using_expected && (
          <tr>
            <th children='추정 카드사용금액' className='border' />
            <td
              children={format_curr(this.state.card_loss_sum_amt_exp)}
              className='border'
            />
          </tr>
        )}
        <tr>
          <th children='산용카드등 소득공제(30%)' className='border' />
          <td
            children={format_curr(Math.round(this.getCardDeduction()))}
            className='border'
          />
        </tr>
      </table>
    );
    const table_transport_loss = (
      <table className='m-3'>
        <tr>
          <th children='교통비' className='border' colSpan='2' />
        </tr>
        {this.state.transport_loss.map(([YYYY_MM, amount]) => (
          <tr>
            <th children={YYYY_MM} className='border' />
            <td children={format_curr(amount)} className='border' />
          </tr>
        ))}
        <tr>
          <th children='교통비' className='border' />
          <td
            children={format_curr(this.state.transport_loss_sum_amt_real)}
            className='border'
          />
        </tr>
        {this.state.using_expected && (
          <tr>
            <th children='추정 교통비' className='border' />
            <td
              children={format_curr(this.state.transport_loss_sum_amt_exp)}
              className='border'
            />
          </tr>
        )}
        <tr>
          <th children='교통비 소득공제(40%)' className='border' />
          <td
            children={format_curr(Math.round(this.getTransportDeduction()))}
            className='border'
          />
        </tr>
      </table>
    );
    const table_incomes = (
      <table className='m-3'>
        <tr>
          <th children='소득금액' className='border' colSpan='2' />
        </tr>
        {this.state.incomes.map(([YYYY_MM, amount]) => (
          <tr>
            <th children={YYYY_MM} className='border' />
            <td children={format_curr(amount)} className='border' />
          </tr>
        ))}
        <tr>
          <th children='근로소득' className='border' />
          <td
            children={format_curr(this.state.income_sum_amt_real)}
            className='border'
          />
        </tr>
        {this.state.using_expected && (
          <tr>
            <th children='추정 근로소득' className='border' />
            <td
              children={format_curr(this.state.income_sum_amt_exp)}
              className='border'
            />
          </tr>
        )}
      </table>
    );

    const table_final = (
      <table className='m-3'>
        <tr>
          <th children='세액산정' className='border' colSpan='2' />
        </tr>
        {Object.entries({
          '(A)근로소득': this.state.income_sum_amt_exp,
          '(B)근로소득 공제액': -Math.round(this.getLaborIncomeDeduction()),
          '(C)종합소득금액[A - B]': Math.round(this.getTotalIncome()),
          '(D)종합소득공제': -Math.round(this.getTotalDeduction()),
          '(E)신용카드사용소득공제': -Math.round(this.getCardDeduction()),
          '(F)교통비소득공제': -Math.round(this.getTransportDeduction()),
          '(G)과세표준[C -D,E,F]': Math.round(this.getBaseTax()),
          '(H)산출세액[from G]': Math.round(this.getCaulatedTax()),
          '(I)특별세액공제': -Math.round(this.getSpecialDeduction()),
          '(J)원천징수세액': -Math.round(this.state.pre_tax_sum_amt_exp),
          '(K)지잔납부세액[H -I,J]': Math.round(this.getFinalDeduction()),
        }).map(([tag, amt]) => (
          <tr key={tag}>
            <th children={tag} className='border' />
            <td children={formatKorean(amt)} className='border text-right' />
          </tr>
        ))}
      </table>
    );

    return (
      <div className='d-flex mx-auto mt-5 flex-column'>
        <h5 children={`${this.state.target_yy}년도 세금 예상`} />

        <div className='d-flex flex-row'>
          {table_incomes}
          {table_pre_tax}
          {table_card_loss}
          {table_transport_loss}
        </div>
        <div className='mx-auto'>{table_final}</div>
      </div>
    );
  }
}

export default TaxCaculator;
