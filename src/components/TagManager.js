import { Component, forwardRef } from 'react';
import {

import { BsCloudUpload, BsFillTrashFill } from 'react-icons/bs';

const listgroup_props = {
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

const FilterItemValueMenu = forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <Form.Control
        autoFocus
        className='mx-3 my-2 w-auto'
        placeholder='Type to filter...'
        onKeyDown={(e) => {
          if (e.key === 'Enter')
            props.onChange({ target: { value: e.target.value } });
        }}
      />
    </div>
  );
});
const FilterItem = ({ filter, deleteFilter, changeFilter, key }) => (
  <ListGroup.Item key={key}>
    <ButtonGroup className='w-100 border rounded border-secondary'>
      <DropdownButton
        className='border-right-0'
        variant='outline-secondary'
        bsPrefix='border-0 btn'
        title={filter.type}
        onClick={(e) => {
          if (e.target.text !== undefined)
            changeFilter(filter, { type: e.target.text });
        }}
      >
        <Dropdown.Item href='#' children='키워드' key='1' />
        <Dropdown.Item href='#' children='정규식' key='2' />
      </DropdownButton>
      <DropdownButton
        className='px-0 flex-fill'
        variant='outline-secondary'
        title={filter.value}
        bsPrefix='w-100 border-top-0 border-bottom-0 rounded-0 btn'
      >
        <Dropdown.Menu
          as={FilterItemValueMenu}
          onChange={(e) => changeFilter(filter, { value: e.target.value })}
        />
      </DropdownButton>
      <Button
        className='pt-0'
        style={{ maxWidth: '2rem' }}
        children={<BsFillTrashFill />}
        size='sm'
        variant='danger'
        onClick={() => deleteFilter(filter)}
      />
    </ButtonGroup>
  </ListGroup.Item>
);
class TagManager extends Component {
  state = {
    target_tag_name: '월급',
    tags: {
      asdasdasd: {
        name: '월급',
        filters: [{ type: '키워드', value: '급여고정상여' }],
      },
      asdasdasd1: {
        name: '세탁',
        filters: [{ type: '키워드', value: '세탁' }],
      },
      asdasdasd2: {
        name: '식비',
        filters: [{ type: '키워드', value: '마트' }],
      },
    },
    filters: [{ type: '키워드', value: '급여고정상여' }],
  };

  insertTag(tag_name) {
    const new_tags = Object.assign({}, this.state.tags);
    new_tags[new Date().toString()] = {
      name: tag_name,
      filters: [],
    };
    this.setState({ tags: new_tags });
  }

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
