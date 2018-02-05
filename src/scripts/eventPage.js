import {browser} from '../browserApi';
import {db} from '../firebaseController';
import {
  SYNC_LOBBY,
  VIDEO_CONTROL,
  CONNECT_LOBBY,
  DISCONNECT_LOBBY,
  CREATE_LOBBY, NEW_VIDEO_TO_LOBBY, REMOVE_LOBBY,
} from '../messageTypes';

const userId = 'userId1';
db.ref(`users/${userId}/lobbies`).once('value').then(lobbiesHistory => {
  console.log(lobbiesHistory.val());
  browser.storage.sync.set({lobbiesHistory: lobbiesHistory.val()});
});

browser.runtime.onConnect.addListener(port => {
  let currentLobbyId = null, videoControllersRef,
      videoState = {isPlaying: false, time: 0};
  port.onDisconnect.addListener(() => {
    browser.storage.sync.get('lobbiesHistory', objWithHistory => {
      objWithHistory.lobbiesHistory[currentLobbyId].sync = false;
      browser.storage.sync.set(objWithHistory);
    });
    videoControllersRef.child('numOfUsers').
        once('value').
        then(numOfUsers => {
          if (numOfUsers.val() === 1) {
            videoControllersRef.
                once('value').
                then(lobbyInfo => {
                  videoControllersRef.
                      update({
                        time: lobbyInfo.val().time +
                        ((Date.now() - lobbyInfo.val().updateTime) / 1000),
                        updateTime: Date.now(),
                        isPlaying: false,
                      });
                });
          }
          videoControllersRef.
              update({numOfUsers: numOfUsers.val() - 1});
        });
  });
  port.onMessage.addListener(message => {
    switch (message.type) {
      case SYNC_LOBBY: {
        browser.storage.sync.get('lobbiesHistory', objWithHistory => {
          objWithHistory.lobbiesHistory[message.payload.lobbyId].sync = true;
          browser.storage.sync.set(objWithHistory);
        });
        currentLobbyId = message.payload.lobbyId;
        videoControllersRef = db.ref(
            `videoControllers/${message.payload.lobbyId}`);
        videoControllersRef.child('numOfUsers').
            once('value').
            then(numOfUsers => {
              let currentIsPlaying;
              videoControllersRef.child('isPlaying').
                  on('value', isPlaying => {
                    currentIsPlaying = isPlaying.val();
                    if (currentIsPlaying !== videoState.isPlaying)
                      port.postMessage({
                        type: VIDEO_CONTROL,
                        payload: {isPlaying: currentIsPlaying},
                      });
                  });
              videoControllersRef.child('time').
                  on('value', time => {
                    if (videoState.time !== time.val()) {
                      if (numOfUsers.val() === 0 || !currentIsPlaying) {
                        port.postMessage({
                          type: VIDEO_CONTROL,
                          payload: {time: time.val()},
                        });
                      } else {
                        videoControllersRef.child('updateTime').
                            once('value').
                            then(updateTime => {
                              port.postMessage({
                                type: VIDEO_CONTROL,
                                payload: {
                                  time: time.val() +
                                  ((Date.now() - updateTime.val()) / 1000),
                                },
                              });
                            });
                      }
                    }
                  });
              videoControllersRef.child('numOfUsers').
                  set(numOfUsers.val() + 1);
            });
        break;
      }
      case VIDEO_CONTROL: {
        videoState = Object.assign(videoState, message.payload);
        videoState.updateTime = Date.now();
        console.log(videoState);
        videoControllersRef.
            update(Object.assign(message.payload, {updateTime: Date.now()}));
        break;
      }
      case CREATE_LOBBY: {
        let newLobbyRef = db.ref('lobbies/').push({name: message.payload.name});
        db.ref(`users/${userId}/lobbies/${newLobbyRef.key}`).
            set({name: message.payload.name});
        db.ref(`videoControllers/${newLobbyRef.key}/`).set({
          isPlaying: false,
          time: 0,
          updateTime: 0,
          numOfUsers: 0,
        });
        browser.storage.sync.get('lobbiesHistory', objWithHistory => {
          objWithHistory.lobbiesHistory[newLobbyRef.key] = {name: message.payload.name};
          browser.storage.sync.set(objWithHistory);
        });
        setLinkToLobby({
          lobbyId: newLobbyRef.key,
          videoIdentity: message.payload.videoIdentity,
          videoState: message.payload.videoState,
        });
        setTimeout(port.postMessage({type: CREATE_LOBBY, payload: {lobbyId: newLobbyRef.key}}), 500);
        break;
      }
      case NEW_VIDEO_TO_LOBBY: {
        setLinkToLobby({
          lobbyId: message.payload.lobbyId,
          videoIdentity: message.payload.videoIdentity,
          videoState: message.payload.videoState,
        });
        break;
      }
    }
  });
});

browser.runtime.onMessage.addListener(message => {
  switch (message.type) {
    case CONNECT_LOBBY: {
      db.ref(`videos/${message.payload.lobbyId}`).
          once('value').
          then(videoIdentity => {
            browser.storage.sync.get('lobbiesHistory', objWithHistory => {
              objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity = videoIdentity.val();
              objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity.link = generateLink(
                  videoIdentity.val());
              browser.storage.sync.set(objWithHistory);
            });
          });
      break;
    }
    case DISCONNECT_LOBBY: {
      browser.storage.sync.get('lobbiesHistory', objWithHistory => {
        objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity = undefined;
        browser.storage.sync.set(objWithHistory);
      });
      break;
    }
    case REMOVE_LOBBY: {
      browser.storage.sync.get('lobbiesHistory', objWithHistory => {
        delete objWithHistory.lobbiesHistory[message.payload.lobbyId];
        browser.storage.sync.set(objWithHistory);
        db.ref(`users/${userId}/lobbies`).set(objWithHistory.lobbiesHistory);
      });
      break;
    }
  }
});

function setLinkToLobby(linkInfo) {
  db.ref(`videoControllers/${linkInfo.lobbyId}/`).update(linkInfo.videoState);
  db.ref(`videos/${linkInfo.lobbyId}`).set(linkInfo.videoIdentity);
}

function generateLink(videoIdentity) {
  let url = '';
  switch (videoIdentity.hostname) {
    case 'www.youtube.com': {
      url += videoIdentity.hostname + '/watch?v=' + videoIdentity.v;
    }
  }
  return url;
}

// let connectedLobbyRef = {};
// lobbyMessenger.addListener(message => console.log(message));
// (function() {
//   storageController.onChange = onStorageChange;
//   storageController.getAsyncStorage('lobbyId').then(data => {
//     if (data.lobbyId === null) return;
//     connectFirebaseLobby(data.lobbyId);
//
//   });
// })();
//
// function connectFirebaseLobby(id) {
//   connectedLobbyRef =  db.ref(`lobbies/${id}`);
//   connectedLobbyRef.child('/link').on('value', link => {
//     console.log(link.val());
//   })
// }
//
// function onStorageChange(changeObj) {
//   if (changeObj.lobbyId !== undefined) {
//     onLobbyChanged(changeObj.lobbyId);
//   }
// }
//
// function onLobbyChanged(newId) {
//   connectFirebaseLobby(newId);
// }
//
//
//
// function videoMessagesListener(message){
//   if(message.playing){
//     connectedLobbyRef.child('isPlaying').set(message.playing);
//   }
//   else if(message.updateTime){
//     connectedLobbyRef.update({updateTime: message.updateTime});
//   }
// }
//
// function checkURL(tab) {
//   let url = new URL(tab.url);
//   return ((url.hostname === connectedLobby.link.domain) &&
//       (url.searchParams.get('v') === connectedLobby.link.id));
// }
/*
let connectedLobby = {};
let executed = false;
storageController.setAsyncStorage({executed: false});
executeScriptToYoutube();

function executeScriptToYoutube() {
  storageController.getAsyncStorage('lobbyId').then(data => {
    console.log(data.lobbyId);
    let connectedLobbyRef = db.ref(`lobbies/${data.lobbyId}`);
    storageController.
        setAsyncStorage({connectedLobbyRef: `lobbies/${data.lobbyId}/`});
    connectedLobbyRef.child('/link').on('value', function(data) {
      storageController.getAsyncStorage('executed').
          then(data => {
            executed = data.executed;
          });
      connectedLobby.link = data.val();
      console.log(connectedLobby);
      browserApi.tabs.query({}, (tabs => {
        console.log(tabs);
        tabs.map(tab => {
          if (checkURL(tab)&& !executed) {
            console.log('inject');
            storageController.setAsyncStorage({executed: true});
            browserApi.tabs.executeScript(tabs[0].id,
                {file: './injection.js'});
          }
        });
      }));
    });
  });
}



browserApi.tabs.onUpdated.addListener(function(tabId, changeObj, updatedTab) {
  console.log(changeObj);
  if (changeObj.status === 'complete') {
    if (checkURL(updatedTab)) {
      browserApi.tabs.executeScript(tabId,
          {file: './injection.js'});
    }
  }
});*/
