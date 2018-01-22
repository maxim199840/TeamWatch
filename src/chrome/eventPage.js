import {db} from '../firbaseController';
import {storageController} from './storageController';

let connectedLobby = null;
let executed = false;
storageController.setAsyncStorage({executed: false});
executeScriptToYoutube();

function executeScriptToYoutube() {
  storageController.getAsyncStorage('lobbyId').then(data => {
    console.log(data.lobbyId);
    let connectedLobbyRef = db.ref(`lobbies/${data.lobbyId}`);
    storageController.
        setAsyncStorage({connectedLobbyRef: `lobbies/${data.lobbyId}/`});
    connectedLobbyRef.on('value', function(data) {
      storageController.getAsyncStorage('executed').
          then(data => {executed = data.executed;});
      connectedLobby = data.val();
      console.log(connectedLobby);
      chrome.tabs.query({'url': connectedLobby.link}, (tabs => {
        console.log(tabs);
        if (tabs.length !== 0 && !executed) {
          storageController.setAsyncStorage({executed: true});
          chrome.tabs.executeScript(tabs[0].id,
              {file: './build/youTube.js'});
        }
      }));
    });
  });
}

/*chrome.tabs.query(
    {'url': 'https://www.youtube.com/watch?annotation_id=annotation_778644711&feature=iv&src_vid=cXiZngLlCGI&v=1cyr4b9uK6o'},
    (tabs => {
      console.log(tabs);
      if (tabs.length !== 0) {
        chrome.tabs.executeScript(tabs[0].id,
            {file: './build/youTube.js'});
      }
    }));*/
/*chrome.tabs.query({},
    function(tabs) {
      tabs.map(item => item = item.url);
      if (tabs.length !== 0) console.log(tabs);
    });*/