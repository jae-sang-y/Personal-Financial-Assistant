import { Component } from 'react';
import { Button, Modal } from 'react-bootstrap';
import firebase from 'firebase/app';
import {
  number_format,
  format_curr,
  format_timestamp,
} from './DataViewer.style';
import { BsFillTrashFill, BsPencil, BsCheck, BsX } from 'react-icons/bs';
class ReceiptEditor extends Component {
  state = {
    content: [
      {
        name: '민트초코',
        value: 3000,
        count: 2,
      },
    ],
  };

  constructor(props) {
    super(props);
    if (props.receipt !== null && props.receipt.content !== null)
      this.setState({ content: props.receipt.content });
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(prevProps.receipt) !==
        JSON.stringify(this.props.receipt) &&
      this.props.receipt !== null
    ) {
      if (this.props.receipt.content === undefined)
        this.setState({ content: [] });
      else this.setState({ content: this.props.receipt.content });
    }
  }

  askAndSet(title, value, callback) {
    const result = prompt(title, value);
    if (result !== null) callback(result);
  }

  appendRow() {
    const content = this.state.content;
    content.push({
      name: '',
      value: 0,
      count: 1,
    });
    this.setState({ content: content });
  }

  deleteRow(idx) {
    const content = this.state.content;
    content.splice(idx, 1);
    this.setState({ content: content });
  }

  updateRow(idx, snapshot) {
    const content = this.state.content;
    content[idx] = Object.assign(content[idx], snapshot);
    this.setState({ content: content });
  }

  syncFirebase() {
    const tran = this.props.receipt.tran;
    const query = {
      path: `transactions/${tran.YYYY_MM}/${tran.timestamp}/receipt`,
      value: this.state.content,
    };

    const ref = firebase.app().database().ref(query.path);
    return ref.set(query.value);
  }

  render() {
    const receipt = this.props.receipt;
    let sum = 0;
    return (
      <Modal show={this.props.show} onHide={this.props.onHide}>
        {receipt !== null && (
          <div>
            <Modal.Header className='d-flex flex-column'>
              <Modal.Title children='영수증' />
              <br />
              <table>
                <thead
                  children={['시간', '변동', '노트', '태그'].map((text) => (
                    <th children={text} className='border text-center' />
                  ))}
                />
                <tbody
                  children={
                    <tr
                      children={[
                        format_timestamp(receipt.tran.timestamp),
                        format_curr(receipt.tran.delta),
                        receipt.tran.note,
                        receipt.tran.tag,
                      ].map((content) => (
                        <td children={content} className='border' />
                      ))}
                    />
                  }
                />
              </table>
            </Modal.Header>
            <Modal.Body className='d-flex w-100 justify-content-center'>
              <table>
                <thead>
                  <tr>
                    <th />
                    {['상품명', '단가', '수량', '금액'].map((text) => (
                      <th
                        key={text}
                        children={text}
                        className='border text-center'
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {this.state.content.map(({ name, value, count }, idx) => (
                    <tr key={idx}>
                      <td
                        children={
                          <Button
                            children={<BsFillTrashFill />}
                            size='sm'
                            variant='danger'
                            className='p-0'
                            onClick={() => this.deleteRow(idx)}
                          />
                        }
                      />
                      <td
                        children={name}
                        className='border text-center'
                        onClick={() =>
                          this.askAndSet('상품명', name, (data) =>
                            this.updateRow(idx, { name: data })
                          )
                        }
                      />
                      <td
                        children={number_format.format(value)}
                        className='border text-right'
                        onClick={() =>
                          this.askAndSet('단가', value, (data) =>
                            this.updateRow(idx, { value: data })
                          )
                        }
                      />
                      <td
                        children={number_format.format(count)}
                        className='border text-right'
                        onClick={() =>
                          this.askAndSet('수량', count, (data) =>
                            this.updateRow(idx, { count: data })
                          )
                        }
                      />
                      <td
                        children={number_format.format(value * count)}
                        className='border text-right text-weight-bold'
                        dummy={(sum += value * count)}
                      />
                    </tr>
                  ))}

                  <tr>
                    <td
                      children={
                        <Button
                          children={<BsPencil />}
                          onClick={() => this.appendRow()}
                          size='sm'
                          variant='success'
                          className='p-0'
                        />
                      }
                    />
                    <th
                      children='합계'
                      colSpan='3'
                      className='border text-center'
                    />
                    <th
                      children={number_format.format(sum)}
                      className={
                        'border text-center' +
                        (Math.round(sum + receipt.tran.delta) === 0
                          ? ''
                          : ' text-danger')
                      }
                    />
                  </tr>
                </tbody>
              </table>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant='danger'
                onClick={this.props.onHide}
                children={<BsX />}
              />
              <Button
                variant='primary'
                disabled={
                  Math.round(sum + Number(receipt.tran.delta)) !== 0 &&
                  receipt.content.length > 0
                }
                onClick={() => {
                  this.syncFirebase().then(this.props.onHide);
                }}
                children={<BsCheck />}
              />
            </Modal.Footer>
          </div>
        )}
      </Modal>
    );
  }
}
export default ReceiptEditor;
