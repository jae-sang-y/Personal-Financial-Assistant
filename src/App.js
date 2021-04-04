import './App.css';

import { Component } from 'react';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { FirebaseAuthProvider } from '@react-firebase/auth';
import { FirebaseDatabaseProvider } from '@react-firebase/database';

import FileUploader from './components/FileUploader';
import DataViewer from './components/DataViewer';
import TagManager from './components/TagManager';
import MonthStatistics from './components/MonthStatistics';
import { Button } from 'react-bootstrap';
import { BsCloudUpload } from 'react-icons/bs';

const config = require('./fireconfig.json');

const Navigator = ({ state, setState }) => {
  if (state === undefined) return '';
  const SignButton = ({ isSignedIn }) => {
    let signData = null;
    if (isSignedIn === true) {
      signData = {
        onClick: () => {
          firebase.auth().signOut();
        },
        children: 'Sign out',
      };
    } else {
      signData = {
        onClick: () => {
          const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(googleAuthProvider);
        },
        children: 'Sign in',
      };
    }
    return (
      <Button
        className='h-100 py-0 px-1 bg-transparent border-light'
        {...signData}
      />
    );
  };

  return (
    <div
      className='bg-dark w-100 p-2 d-flex align-items-center'
      style={{ height: '3rem' }}
    >
      {['DataViewer', 'TagManager', 'MonthStatistics'].map((text, pk) => (
        <Button
          active
          key={pk}
          className={
            'h-100 py-0 px-1 bg-transparent border-0 ' +
            (text === state.page ? 'font-weight-bold' : '')
          }
          style={{ boxShadow: 'none' }}
          children={text === state.page ? <u children={text} /> : text}
          onClick={() => setState({ page: text })}
        />
      ))}

      <BsCloudUpload
        as='button'
        className='text-light ml-auto mr-3 my-1 align-self-end'
        style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
        onClick={() => setState({ showFileUploader: true })}
      />
      <SignButton isSignedIn={state.auth.isSignedIn} />
    </div>
  );
};

class ImprovedFirebaseAuthProvider extends FirebaseAuthProvider {
  componentDidUpdate(prevProps, prevState) {
    const new_auth = {
      isSignedIn: this.state.isSignedIn,
      providerId: this.state.providerId,
      user: this.state.user,
    };
    if (prevState === undefined) {
      if (this.props.onChange !== undefined) this.props.onChange(new_auth);
      return;
    }
    const old_auth = {
      isSignedIn: prevState.isSignedIn,
      providerId: prevState.providerId,
      user: prevState.user,
    };
    if (JSON.stringify(old_auth) !== JSON.stringify(new_auth))
      if (this.props.onChange !== undefined) this.props.onChange(new_auth);
  }
}

class App extends Component {
  state = {
    auth: {
      isSignedIn: false,
      user: null,
      providerId: null,
    },
    showFileUploader: false,
    page: 'MonthStatistics',
  };

  render() {
    return (
      <div className='App'>
        <ImprovedFirebaseAuthProvider
          firebase={firebase}
          {...config}
          onChange={({ isSignedIn, providerId, user }) => {
            this.setState({
              auth: {
                isSignedIn: isSignedIn,
                providerId: providerId,
                user: user,
              },
            });
          }}
        >
          <FirebaseDatabaseProvider firebase={firebase} {...config}>
            <div>
              <Navigator
                state={this.state}
                setState={(d) => this.setState(d)}
              />
              {this.state.auth.isSignedIn === true && (
                <FileUploader
                  show={this.state.showFileUploader}
                  onHide={() => this.setState({ showFileUploader: false })}
                />
              )}
              {this.state.auth.isSignedIn === true ? (
                <div
                  className='border d-flex flex-column w-100 m-0'
                  style={{ overflowY: 'auto', height: 'calc(100vh - 3rem)' }}
                  children={
                    {
                      DataViewer: <DataViewer />,
                      TagManager: <TagManager />,
                      MonthStatistics: <MonthStatistics />,
                    }[this.state.page]
                  }
                />
              ) : (
                <span children={'You have to sign up to access data.'} />
              )}
            </div>
          </FirebaseDatabaseProvider>
        </ImprovedFirebaseAuthProvider>
      </div>
    );
  }
}

export default App;
