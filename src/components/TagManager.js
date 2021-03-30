import { Component, forwardRef } from 'react';
import {
  Card,
  ListGroup,
  Button,
  FormControl,
  DropdownButton,
  Dropdown,
  ButtonGroup,
  Form,
} from 'react-bootstrap';
import {
  FirebaseDatabaseNode,
  FirebaseDatabaseMutation,
} from '@react-firebase/database';

import { BsFillTrashFill } from 'react-icons/bs';

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
        title={<span style={{ whiteSpace: 'pre' }} children={filter.value} />}
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
    target_tag_name: undefined,
    tags: {},
    filters: [],
  };
  set_tags = undefined;

  async syncWithFirebase() {
    await this.set_tags(this.state.tags);
  }

  insertTag(tag_name) {
    const new_tags = Object.assign({}, this.state.tags);
    new_tags[tag_name] = {
      name: tag_name,
      filters: [],
    };
    this.setState({ tags: new_tags }, () => this.syncWithFirebase());
  }

  deleteTag(tag_name) {
    const new_tags = {};
    Object.entries(this.state.tags)
      .filter(([key]) => key !== tag_name)
      .forEach(([key, value]) => {
        new_tags[key] = value;
      });
    this.setState({ tags: new_tags }, () => this.syncWithFirebase());
  }

  chooseTag(tag_name) {
    let new_filters = [];
    const new_target_tag_name = tag_name;
    const target_tag_entry = Object.entries(this.state.tags).find(
      ([key, value]) => key === tag_name
    );

    if (
      target_tag_entry !== undefined &&
      target_tag_entry[1].filters !== undefined
    )
      new_filters = target_tag_entry[1].filters;
    this.setState({
      filters: new_filters,
      target_tag_name: new_target_tag_name,
    });
  }

  updateFilter() {
    const new_tags = {};
    Object.entries(this.state.tags)
      .map(([key, value]) => {
        if (key === this.state.target_tag_name)
          return [key, { filters: this.state.filters }];
        else return [key, value];
      })
      .forEach(([key, value]) => {
        new_tags[key] = value;
      });
    this.setState(
      {
        tags: new_tags,
      },
      () => this.syncWithFirebase()
    );
  }

  changeFilter(filter, new_filter) {
    const new_filters = this.state.filters.map(({ type, value }) => {
      if (type === filter.type && value === filter.value)
        return {
          type: new_filter.type || type,
          value: new_filter.value || value,
        };
      else return { type: type, value: value };
    });
    this.setState(
      {
        filters: new_filters,
      },
      () => this.updateFilter()
    );
  }

  deleteFilter(filter) {
    const new_filters = this.state.filters.filter(
      ({ type, value }) => type !== filter.type || value !== filter.value
    );
    this.setState(
      {
        filters: new_filters,
      },
      () => this.updateFilter()
    );
  }
  insertFilter(filter) {
    const new_filters = Array.from(this.state.filters);
    new_filters.push(filter);
    this.setState(
      {
        filters: new_filters,
      },
      () => this.updateFilter()
    );
  }

  render() {
    return (
      <div className='d-flex justify-content-center h-100 pt-4 flex-column'>
        <div className='flex-fill d-flex'>
          <Card {...card_props}>
            <h5 children='태그' className='font-weight-bold my-1' />
            <ListGroup {...listgroup_props}>
              <FirebaseDatabaseNode
                path='tags/'
                children={(d) => {
                  if (
                    d.value !== null &&
                    JSON.stringify(this.state.tags) !== JSON.stringify(d.value)
                  )
                    this.setState({ tags: d.value });
                  return '';
                }}
              />
              {Object.entries(this.state.tags).map(([key, value]) => (
                <ListGroup.Item key={key} className='d-flex'>
                  <span
                    children={key}
                    style={{ cursor: 'pointer' }}
                    className='ml-auto'
                    onClick={() => this.chooseTag(key)}
                  />
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
            <h5
              children={
                this.state.target_tag_name === undefined
                  ? '태그를 선택해주세요'
                  : `${this.state.target_tag_name}의 필터`
              }
              className='font-weight-bold my-1'
            />
            <ListGroup {...listgroup_props}>
              {this.state.filters.map((filter, pk) => (
                <FilterItem
                  pk={pk}
                  filter={filter}
                  deleteFilter={(e) => this.deleteFilter(e)}
                  changeFilter={(e, s) => this.changeFilter(e, s)}
                />
              ))}
            </ListGroup>
          </Card>
        </div>
        <div className='w-100 d-flex flex-row' style={{ height: '30rem' }}>
          <div className='w-50 h-100 p-3'>
            <FormControl
              className='w-100 h-100'
              placeholder='태그 추가'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  this.insertTag(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
          <div className='w-50 h-100 p-3'>
            <FormControl
              className='w-100 h-100'
              placeholder='필터 추가'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  this.insertFilter({ type: '키워드', value: e.target.value });
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
        <FirebaseDatabaseMutation
          type='set'
          path='tags'
          children={({ runMutation }) => {
            this.set_tags = runMutation;
            return '';
          }}
        />
      </div>
    );
  }
}
export default TagManager;
