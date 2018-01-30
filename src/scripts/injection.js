import {browser} from '../browserApi';
import {LINK_WITH_LOBBY, VIDEO_CONTROL} from '../messageTypes';

browser.runtime.onMessage.addListener(onMessage);

let video;

function onMessage({type, payload}, sender, responseCallback) {
  switch (type) {
    case LINK_WITH_LOBBY: {
      const isTabMatched = checkVideoIdentityMatch(payload.videoIdentity);
      if (!isTabMatched) {
        responseCallback(false);
        return;
      }
      responseCallback(true);

      video = document.
          getElementsByClassName('video-stream html5-main-video')[0];
      const port = browser.runtime.connect();
      port.onMessage.addListener(onMessage);
      port.postMessage({
        type: LINK_WITH_LOBBY,
        payload: {
          lobbyId: payload.lobbyId,
        },
      });

      video.onplay = () => port.postMessage({
        type: VIDEO_CONTROL,
        payload: {
          isPlaying: true,
        },
      });
      video.onpause = () => port.postMessage({
        type: VIDEO_CONTROL,
        payload: {
          isPlaying: false,
        },
      });
      video.onseeked = () => port.postMessage({
        type: VIDEO_CONTROL,
        payload: {
          time: video.currentTime,
        },
      });

      break;
    }
    case VIDEO_CONTROL: {
      const {isPlaying, time} = payload;
      if (typeof(isPlaying) === 'boolean') {
        if (isPlaying) {
          video.play();
        } else {
          video.pause();
        }
      }
      if (typeof time === 'number') {
        video.currentTime = time;
      }
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
