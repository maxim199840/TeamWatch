import {browser} from '../browserApi';
import {db} from '../firebaseController';
import {
  LINK_WITH_LOBBY,
  VIDEO_CONTROL,
  CONNECT_TO_LOBBY,
} from '../messageTypes';

db.ref(`users/userId1/lobbies`).once('value').then(lobbiesHistory => {
  console.log(lobbiesHistory.val());
  browser.storage.sync.set({lobbiesHistory: lobbiesHistory.val()});
});

browser.runtime.onConnect.addListener(port => {
  port.onDisconnect.addListener(() => {
    db.ref(`videoControllers/${message.payload.lobbyId}/numOfUsers`).
        once('value').
        then(numOfUsers => {
          if (numOfUsers.val() === 1) {
            db.ref(`videoControllers/${message.payload.lobbyId}/`).
                once('value').
                then(lobbyInfo => {
                  db.ref(`videoControllers/${message.payload.lobbyId}/`).
                      update({
                        time: lobbyInfo.val().time +
                        (Date.now() - lobbyInfo.val().updateTime),
                        updateTime: Date.now(),
                        isPlaying: false,
                      });
                });
          }
          db.ref(`videoControllers/${message.payload.lobbyId}/numOfUsers`).
              update(numOfUsers.val() - 1);
        });
  });
  port.onMessage.addListener(message => {
    switch (message.type) {
      case LINK_WITH_LOBBY: {
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
                    if (numOfUsers.val() === 0 && !currentIsPlaying) {
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
                                (Date.now() - updateTime.val()),
                              },
                            });
                          });
                    }
                  });
              db.ref(`videoControllers/${message.payload.lobbyId}/numOfUsers`).
                  update(numOfUsers.val() + 1);
            });
        break;
      }
      case VIDEO_CONTROL: {
        db.ref(`videoControllers/${message.payload.lobbyId}/`).
            update(Object.assign(message.payload, {updateTime: Date.now()}));
        break;
      }
    }
  });
});

/*browser.storage.sync.set({
  lobbiesHistory: {
    lobbyId0: {
      name: 'KEK Show',
      videoIdentity: {},
    },
  },
});*/

browser.runtime.onMessage.addListener(message => {
  if (message.type === CONNECT_TO_LOBBY) {
    db.ref(`videos/${message.payload.lobbyId}`).
        once('value').
        then(videoIdentity => {
          browser.storage.sync.get('lobbiesHistory', objWithHistory => {
            objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity = videoIdentity.val();
            browser.storage.sync.set(objWithHistory);
          });
        });
  }
});

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