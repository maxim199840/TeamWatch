import firebase from 'firebase';
import firebaseui from 'firebaseui';

const config = {
  apiKey: 'AIzaSyBHR8HiWc-ffevxEqVwrIfuiJjkvlEf_Ew',
  authDomain: 'teamwatch-d4d79.firebaseapp.com',
  databaseURL: 'https://teamwatch-d4d79.firebaseio.com',
  projectId: 'teamwatch-d4d79',
  storageBucket: 'teamwatch-d4d79.appspot.com',
  messagingSenderId: '420571941064',
};
firebase.initializeApp(config);

export {firebase};
export {firebaseui};
export const db = firebase.database();
export const auth = firebase.auth();
