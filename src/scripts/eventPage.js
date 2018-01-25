import {browser} from '../browserApi';

// browser.storage.sync.clear();
browser.storage.sync.set({lobbyId: "a", link: {}});

browser.runtime.onConnect.addListener(port => {
  console.log('Port connected:', port);
  port.onMessage.addListener(message => console.log(message));
  port.postMessage({type: 'PRINYAL', payload: {}});
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
