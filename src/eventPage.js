/*import firebase from 'firebase';
import {injectYoutubeControl} from './youTubeController';
//import * as vuefire from 'vuefire';
let config = {
  apiKey: 'AIzaSyBHR8HiWc-ffevxEqVwrIfuiJjkvlEf_Ew',
  authDomain: 'teamwatch-d4d79.firebaseapp.com',
  databaseURL: 'https://teamwatch-d4d79.firebaseio.com',
  projectId: 'teamwatch-d4d79',
  storageBucket: 'teamwatch-d4d79.appspot.com',
  messagingSenderId: '420571941064',
};
firebase.initializeApp(config);

let db = firebase.database();
let lobbiesRef = db.ref('lobbies');
let lobbies = null;
lobbiesRef.on('value', function(data) {
  lobbies = data.val();
  console.log(lobbies);
  let tab = [];
  let videoPage = null;
  chrome.tabs.query({'url': lobbies[0].link/!*, 'active': true, 'lastFocusedWindow': true*!/}, (tabs => {
    console.log(tabs);
    if(tabs.length!==0){
      chrome.tabs.executeScript(tabs[0].id, {file:'./build/youTubeController.js'});
    }
  }));
});*/

chrome.tabs.query(
    {'url': 'https://www.youtube.com/watch?annotation_id=annotation_778644711&feature=iv&src_vid=cXiZngLlCGI&v=1cyr4b9uK6o'},
    (tabs => {
      console.log(tabs);
      if (tabs.length !== 0) {
        chrome.tabs.executeScript(tabs[0].id,
            {file: './build/youTubeController.js'});
      }
    }));
/*chrome.tabs.query({},
    function(tabs) {
      tabs.map(item => item = item.url);
      if (tabs.length !== 0) console.log(tabs);
    });*/