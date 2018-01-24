import {Messenger} from '../chrome/Messenger';

let lobbyMessenger = new Messenger('lobby');
//browser.runtime.onConnectExternal.addListener((port)=>console.log(port));
let currentLink = null;
(function() {
  lobbyMessenger.send('Hi!');
  lobbyMessenger.addListener(lobbyListener);
})();

function lobbyListener(message) {
  console.log(message);
  if(message.link){
    currentLink = message.link;
    if(checkURL(message.link)){
      bindListeners();
    }
  }
}

function bindListeners(){
  console.log('injected');
  let videoSyncMessenger = new Messenger('video');
  let video = document.getElementsByClassName('video-stream html5-main-video')[0];
  video.onplay = function(event) {
    videoSyncMessenger.send({playing: true});
    /*connectedLobbyRef.child('isPlaying').set(true);*/
  };
  video.onpause = function(event) {
    videoSyncMessenger.send({playing: true});
    /*connectedLobbyRef.child('isPlaying').set(false);*/
  };
  video.onseeked = function(event) {
    videoSyncMessenger.send({updateTime: video.currentTime});
    /*connectedLobbyRef.update({updateTime: video.currentTime});*/
  };
  connectedLobbyRef.child('updateTime').on('value', data => {
    /*video.currentTime = data.val();*/
  });
}

function checkURL(link) {
  let url = new URL(document.location.href);
  return ((url.hostname === link.domain) &&
      (url.searchParams.get('v') === link.id));
}
/*let video = document.getElementsByClassName('video-stream html5-main-video')[0];
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
});*/
