import {storageController} from './storageController';
import {db} from '../firbaseController';

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
      chrome.tabs.query({}, (tabs => {
        console.log(tabs);
        tabs.map(tab => {
          if (checkURL(tab)&& !executed) {
            console.log('inject');
            storageController.setAsyncStorage({executed: true});
            chrome.tabs.executeScript(tabs[0].id,
                {file: './youTube.js'});
          }
        });
      }));
    });
  });
}

function checkURL(tab) {
  let url = new URL(tab.url);
  return ((url.hostname === connectedLobby.link.domain) &&
      (url.searchParams.get('v') === connectedLobby.link.id));
}

chrome.tabs.onUpdated.addListener(function(tabId, changeObj, updatedTab) {
  console.log(changeObj);
  if (changeObj.status === 'complete') {
    if (checkURL(updatedTab)) {
      chrome.tabs.executeScript(tabId,
          {file: './youTube.js'});
    }
  }
});