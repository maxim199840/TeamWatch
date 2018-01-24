import {db} from '../firbaseController';
import {storageController} from '../chrome/storageController';
let video = document.getElementsByClassName('video-stream html5-main-video')[0];
console.log('injected');
storageController.getAsyncStorage('connectedLobbyRef').then(data => {
  let connectedLobbyRef = db.ref(data.connectedLobbyRef);
  connectedLobbyRef.child('isPlaying').on('value', data => {
    console.log(data.val());
    if (data.val() === true) video.play();
    else if (data.val() === false) video.pause();
  });
  video.onplay = function(event) {
    connectedLobbyRef.child('isPlaying').set(true);
  };
  video.onpause = function(event) {
    connectedLobbyRef.child('isPlaying').set(false);
  };
  video.onseeked = function(event) {
    connectedLobbyRef.update({updateTime: video.currentTime});
  };
  connectedLobbyRef.child('updateTime').on('value', data => {
    video.currentTime = data.val();
  });
});
