import './App.css';

import { Container } from 'react-bootstrap';
import { Component } from 'react';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { FirebaseAuthProvider } from '@react-firebase/auth';
import { FirebaseDatabaseProvider } from '@react-firebase/database';

import FileUploader from './components/FileUploader';
import DataViewer from './components/DataViewer';

const config = require('./fireconfig.json'); //
const SignButton = (isSignedIn) => {
  return (
    <>
      {isSignedIn ? (
        <button
          onClick={() => {
            firebase.auth().signOut();
          }}
          children='Sign out'
        />
      ) : (
        <button
          onClick={() => {
            const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(googleAuthProvider);
          }}
          children='Sign in'
        />
      )}
    </>
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
  };

  render() {
    return (
      <div className='App'>
        <Container className='border d-flex flex-column'></Container>
        <ImprovedFirebaseAuthProvider
          firebase={firebase}
          {...config}
          onChange={({ isSignedIn, providerId, user }) =>
            this.setState({
              isSignedIn: isSignedIn,
              providerId: providerId,
              user: user,
            })
          }
        >
          <FirebaseDatabaseProvider firebase={firebase} {...config}>
            <div>
              <SignButton isSignedIn={this.state.auth.isSignedIn} />
              <FileUploader />
              <DataViewer />
            </div>
          </FirebaseDatabaseProvider>
        </ImprovedFirebaseAuthProvider>
      </div>
    );
  }
}

export default App;
