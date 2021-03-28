import { Component } from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';

import { BsCloudUpload, BsFillTrashFill } from 'react-icons/bs';

const listgroup_props = {
  variant: 'flush',
  style: {
    height: 'calc(100vh - 12rem)',
    overflowY: 'auto',
  },
};

const listgroupitem_props = {
  variant: 'flush',
  style: {
    height: 'calc(100vh - 12rem)',
    overflowY: 'auto',
  },
};

const card_props = {
  style: {
    width: 'calc(50vw - 2rem)',
  },
  className: 'mx-3',
};

class TagManager extends Component {
  state = {
    tags: {
      asdasdasd: {
        name: '월급',
        filters: [{ type: 'keyword', value: '급여고정상여' }],
      },
      asdasdasd1: {
        name: '세탁',
        filters: [{ type: 'keyword', value: '세탁' }],
      },
      asdasdasd2: {
        name: '식비',
        filters: [{ type: 'keyword', value: '마트' }],
      },
    },
  };
  deleteTag(tag_name) {
    const new_tags = {};
    Object.entries(this.state.tags)
      .filter(([key]) => key !== tag_name)
      .forEach(([key, value]) => {
        new_tags[key] = value;
      });
    this.setState({ tags: new_tags });
    console.log(tag_name, new_tags);
  }

  render() {
    return (
      <div className='d-flex justify-content-center h-100 pt-4 flex-column'>
        <div className='flex-fill d-flex'>
          <Card {...card_props}>
            <h5 children='태그' className='font-weight-bold' />
            <ListGroup {...listgroup_props}>
              {Object.entries(this.state.tags).map(([key, value]) => (
                <ListGroup.Item key={key} className='d-flex'>
                  <span children={value.name} className='ml-auto' />
                  <Button
                    className='ml-auto pt-0 px-1'
                    children={<BsFillTrashFill />}
                    size='sm'
                    variant='danger'
                    onClick={() => this.deleteTag(key)}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
          <Card {...card_props}>
            <h5 children='태그' className='font-weight-bold' />
            <ListGroup {...listgroup_props}>
              <ListGroup.Item>Cras justo odio</ListGroup.Item>
              <ListGroup.Item>Dapibus ac facilisis in</ListGroup.Item>
              <ListGroup.Item>Vestibulum at eros</ListGroup.Item>
            </ListGroup>
          </Card>
        </div>
        <div className='w-100 d-flex flex-row' style={{ height: '30rem' }}>
          <div className='bg-success w-50 h-100'></div>
          <div className='bg-danger w-50 h-100'></div>
        </div>
      </div>
    );
  }
}
export default TagManager;
