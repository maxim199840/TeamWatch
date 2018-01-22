import firebase from 'firebase';

let config = {
  apiKey: 'AIzaSyBHR8HiWc-ffevxEqVwrIfuiJjkvlEf_Ew',
  authDomain: 'teamwatch-d4d79.firebaseapp.com',
  databaseURL: 'https://teamwatch-d4d79.firebaseio.com',
  projectId: 'teamwatch-d4d79',
  storageBucket: 'teamwatch-d4d79.appspot.com',
  messagingSenderId: '420571941064',
};

firebase.initializeApp(config);

export {
  firebase,
};
export let db = firebase.database();
export let auth = firebase.auth();
