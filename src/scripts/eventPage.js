import {browser} from '../browserApi';
import {db} from '../firebaseController';
import {
  SYNC_WITH_LOBBY,
  VIDEO_CONTROL,
  CONNECT_TO_LOBBY, DISCONNECT_FROM_LOBBY,
} from '../messageTypes';

db.ref(`users/userId1/lobbies`).once('value').then(lobbiesHistory => {
  console.log(lobbiesHistory.val());
  browser.storage.sync.set({lobbiesHistory: lobbiesHistory.val()});
});

browser.runtime.onConnect.addListener(port => {
  let currentLobbyId = null;
  port.onDisconnect.addListener(() => {
    browser.storage.sync.get('lobbiesHistory', objWithHistory => {
      objWithHistory.lobbiesHistory[currentLobbyId].sync = false;
      browser.storage.sync.set(objWithHistory);
    });
    db.ref(`videoControllers/${currentLobbyId}/numOfUsers`).
        once('value').
        then(numOfUsers => {
          if (numOfUsers.val() === 1) {
            db.ref(`videoControllers/${currentLobbyId}/`).
                once('value').
                then(lobbyInfo => {
                  db.ref(`videoControllers/${currentLobbyId}/`).
                      update({
                        time: lobbyInfo.val().time +
                        ((Date.now() - lobbyInfo.val().updateTime) / 1000),
                        updateTime: Date.now(),
                        isPlaying: false,
                      });
                });
          }
          db.ref(`videoControllers/${currentLobbyId}/`).
              update({numOfUsers: numOfUsers.val() - 1});
        });
  });
  port.onMessage.addListener(message => {
    switch (message.type) {
      case SYNC_WITH_LOBBY: {
        browser.storage.sync.get('lobbiesHistory', objWithHistory => {
          objWithHistory.lobbiesHistory[message.payload.lobbyId].sync = true;
          browser.storage.sync.set(objWithHistory);
        });
        currentLobbyId = message.payload.lobbyId;
        db.ref(`videoControllers/${message.payload.lobbyId}/numOfUsers`).
            once('value').
            then(numOfUsers => {
              let currentIsPlaying;
              db.ref(`videoControllers/${message.payload.lobbyId}/isPlaying`).
                  on('value', isPlaying => {
                    currentIsPlaying = isPlaying.val();
                    port.postMessage({
                      type: VIDEO_CONTROL,
                      payload: {isPlaying: currentIsPlaying},
                    });
                  });
              db.ref(`videoControllers/${message.payload.lobbyId}/time`).
                  on('value', time => {
                    if (numOfUsers.val() === 0 || !currentIsPlaying) {
                      port.postMessage({
                        type: VIDEO_CONTROL,
                        payload: {time: time.val()},
                      });
                    } else {
                      db.ref(
                          `videoControllers/${message.payload.lobbyId}/updateTime`).
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
                  });
              db.ref(`videoControllers/${message.payload.lobbyId}/numOfUsers`).
                  set(numOfUsers.val() + 1);
            });
        break;
      }
      case VIDEO_CONTROL: {
        db.ref(`videoControllers/${currentLobbyId}/`).
            update(Object.assign(message.payload, {updateTime: Date.now()}));
        break;
      }
    }
  });
});

browser.runtime.onMessage.addListener(message => {
  switch (message.type) {
    case CONNECT_TO_LOBBY: {
      db.ref(`videos/${message.payload.lobbyId}`).
          once('value').
          then(videoIdentity => {
            browser.storage.sync.get('lobbiesHistory', objWithHistory => {
              objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity = videoIdentity.val();
              objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity.link = generateLink(videoIdentity.val());
              browser.storage.sync.set(objWithHistory);
            });
          });
      break;
    }
    case DISCONNECT_FROM_LOBBY: {
      browser.storage.sync.get('lobbiesHistory', objWithHistory => {
        objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity = undefined;
        browser.storage.sync.set(objWithHistory);
      });
      break;
    }
  }
});

function generateLink(videoIdentity){
  let url = "";
  switch(videoIdentity.hostname){
    case "www.youtube.com":{
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
