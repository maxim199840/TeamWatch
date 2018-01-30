import {browser} from '../browserApi';
import {LINK_WITH_LOBBY} from '../messageTypes';

browser.runtime.onMessage.addListener(onMessage);

function onMessage({type, payload}, sender, isConnectedCallback) {
  switch (type) {
    case LINK_WITH_LOBBY: {
      const isTabMathed = checkVideoIdentityMatch(payload.videoIdentity);
      if (!isTabMathed) {
        isConnectedCallback(false);
        return;
      }
      isConnectedCallback(true);
      const port = browser.runtime.connect();
      port.postMessage({
        type: LINK_WITH_LOBBY,
        payload: {
          lobbyId: payload.lobbyId,
        },
      });
      break;
    }
  }
}

function checkVideoIdentityMatch(videoIdentity) {
  const url = new URL(document.location.href);
  if (url.hostname === videoIdentity.hostname) {
    return url.searchParams.get('v') === videoIdentity.v;
  }
}

// browser.storage.sync.get('lobbyId', ({lobbyId}) => {
//   onLobbyChange(lobbyId);
//   browser.storage.onChanged.addListener(({lobbyId}) => {
//         if (lobbyId) onLobbyChange(lobbyId.newValue);
//       },
//   );
// });
//
// function onLobbyChange(lobbyId) {
//   if (port) {
//     port.disconnect();
//     port = null;
//   }
//   if (lobbyId) {
//     if (true/*Todo: check if this page is what we need (sorryamba for my bad English)*/) {
//       port = browser.runtime.connect({name: 'Tab'});
//       port.onMessage.addListener(onMessage);
//       port.postMessage({
//         type: LINK_WITH_LOBBY,
//         payload: {lobbyId},
//       });
//     }
//   }
// }

// function lobbyListener(message) {
//   console.log(message);
//   if(message.link){
//     currentLink = message.link;
//     if(checkURL(message.link)){
//       bindListeners();
//     }
//   }
// }
//
// function bindListeners(){
//   console.log('injected');
//   let videoSyncMessenger = new Messenger('video');
//   let video = document.getElementsByClassName('video-stream html5-main-video')[0];
//   video.onplay = function(event) {
//     videoSyncMessenger.send({playing: true});
//     /*connectedLobbyRef.child('isPlaying').set(true);*/
//   };
//   video.onpause = function(event) {
//     videoSyncMessenger.send({playing: true});
//     /*connectedLobbyRef.child('isPlaying').set(false);*/
//   };
//   video.onseeked = function(event) {
//     videoSyncMessenger.send({updateTime: video.currentTime});
//     /*connectedLobbyRef.update({updateTime: video.currentTime});*/
//   };
//   connectedLobbyRef.child('updateTime').on('value', data => {
//     /*video.currentTime = data.val();*/
//   });
// }
//
// function checkURL(link) {
//   let url = new URL(document.location.href);
//   return ((url.hostname === link.domain) &&
//       (url.searchParams.get('v') === link.id));
// }
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
