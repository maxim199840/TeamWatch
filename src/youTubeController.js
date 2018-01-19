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
let db = firebase.database();
let lobbiesRef = db.ref('lobbies/0/isPlaying');
let video = document.getElementsByClassName('video-stream html5-main-video')[0];
console.log(document.body);
console.log(video);
lobbiesRef.on('value', data => {
  console.log(data.val());
  if(data.val() === true) video.play();
  else if(data.val() === false) video.pause();
});
video.onplay = function(event) {
  db.ref('lobbies/0').update({isPlaying: true});
};
video.onpause = function(event) {
  db.ref('lobbies/0').update({isPlaying: false});
};
video.onseeked = function(event) {
  db.ref('lobbies/0').update({updateTime: video.currentTime});
};
db.ref('lobbies/0/updateTime').on('value', data => {
  video.currentTime = data.val();
});