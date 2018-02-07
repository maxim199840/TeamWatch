import {browser} from '../browserApi';
import {auth, db, firebase, firebaseui} from '../firebaseController';
import {
  CONNECT_LOBBY,
  CREATE_LOBBY,
  DISCONNECT_LOBBY,
  NEW_VIDEO_TO_LOBBY,
  REMOVE_LOBBY,
  SIGN_IN,
  SYNC_LOBBY,
  VIDEO_CONTROL,
} from '../messageTypes';

if (location.pathname.match(/\/auth\.html.*/)) {

  console.log(window, location);

  new firebaseui.auth.AuthUI(auth).start('#auth', {
    callbacks: {
      signInSuccess: function(user, credential) {
        console.log(user, credential);
        browser.storage.sync.set({
          user: {
            uid: user.uid,
            displayName: user.displayName,
            photo: user.photoURL,
          },
        });
        window.close();
        return false;
      },
      signInFailure: function(error) {
        console.log(error);
        window.close();
      },
    },
    signInFlow: 'popup',
    signInOptions: [
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        customParameters: {prompt: 'select_account'},
      },
      // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      // firebase.auth.GithubAuthProvider.PROVIDER_ID,
      {
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        requireDisplayName: true,
      },
      // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    ],
  })
  ;

} else {

  browser.runtime.onMessage.addListener(onSignIn);

  function onSignIn({type}) {
    if (type !== SIGN_IN) return;

    openPopupAtCenter('auth.html', 'Sign in Team Watch', 480, 320);
  }

  function openPopupAtCenter(url, title, w, h) {
    // Fixes dual-screen position for most browsers(1) and Firefox(2)
    const dualScreenLeft = window.screenLeft !== undefined
        ? window.screenLeft
        : screen.left;
    const dualScreenTop = window.screenTop !== undefined
        ? window.screenTop
        : screen.top;

    const width = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
            ? document.documentElement.clientWidth
            : screen.width;
    const height = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
            ? document.documentElement.clientHeight
            : screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 2) - (h / 2)) + dualScreenTop;
    const newWindow = window.open(url, title,
        `scrollbars=yes,resizable,width=${w},height=${h},top=${top},left=${left}`);

    // Puts focus on the newWindow
    if (window.focus) {
      newWindow.focus();
    }
  }

  let userId = null;
  browser.storage.sync.get('user', ({user}) => {
    if (user) {
      userId = user.uid;
      db.ref(`users/${userId}/lobbies`).once('value').then(lobbiesHistory => {
        let userLobbiesHistory = lobbiesHistory.val() ?
            lobbiesHistory.val() :
            {};
        browser.storage.sync.set({lobbiesHistory: userLobbiesHistory});
      });
    } else browser.storage.sync.set({lobbiesHistory: {}});
  });
  browser.storage.onChanged.addListener(({user}) => {
    if (!user) return;
    if (!user.newValue) {
      browser.storage.sync.set({lobbiesHistory: {}});
      return;
    }
    userId = user.newValue.uid;
    db.ref(`users/${userId}/lobbies`).on('value', lobbiesHistory => {
      if (!lobbiesHistory.val()) {
        db.ref('users').update({
          [userId]: {
            name: user.newValue.displayName,
          },
        });
      }
      let userLobbiesHistory = lobbiesHistory.val() ? lobbiesHistory.val() : {};
      browser.storage.sync.set({lobbiesHistory: userLobbiesHistory});
    });
  });

  browser.runtime.onConnect.addListener(port => {
    let currentLobbyId = null, videoControllersRef,
        videoState = {isPlaying: false, time: 0};
    port.onDisconnect.addListener(() => {

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
            browser.storage.sync.get('lobbiesHistory', objWithHistory => {
              objWithHistory.lobbiesHistory[currentLobbyId].sync = false;
              browser.storage.sync.set(objWithHistory);
            });
          });
    });
    port.onMessage.addListener(message => {
      switch (message.type) {
        case SYNC_LOBBY: {
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
                browser.storage.sync.get('lobbiesHistory', objWithHistory => {
                  objWithHistory.lobbiesHistory[message.payload.lobbyId].sync = true;
                  browser.storage.sync.set(objWithHistory);
                });
              });
          break;
        }
        case VIDEO_CONTROL: {
          videoState = Object.assign(videoState, message.payload);
          videoState.updateTime = Date.now();
          console.log(videoState);
          videoControllersRef.
              update(
                  Object.assign(message.payload, {updateTime: Date.now()}));
          break;
        }
        case CREATE_LOBBY: {
          let newLobbyRef = db.ref('lobbies/').
              push({name: message.payload.name});
          db.ref(`users/${userId}/lobbies/${newLobbyRef.key}`).
              set({name: message.payload.name});
          db.ref(`videoControllers/${newLobbyRef.key}/`).set({
            isPlaying: false,
            time: 0,
            updateTime: 0,
            numOfUsers: 0,
          });
          browser.storage.sync.get('lobbiesHistory', objWithHistory => {
            objWithHistory.lobbiesHistory[newLobbyRef.key] = {
              name: message.payload.name,
              videoIdentity: message.payload.videoIdentity,
            };
            browser.storage.sync.set(objWithHistory);
          });
          setLinkToLobby({
            lobbyId: newLobbyRef.key,
            videoIdentity: message.payload.videoIdentity,
            videoState: message.payload.videoState,
          });
          setTimeout(port.postMessage(
              {type: CREATE_LOBBY, payload: {lobbyId: newLobbyRef.key}}),
              500);
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
        connectLobby(message);
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
          db.ref(`users/${userId}/lobbies`).
              set(objWithHistory.lobbiesHistory);
        });
        break;
      }
    }
  });

  function connectLobby(message) {
    db.ref(`videos/${message.payload.lobbyId}`).
        once('value').
        then(videoIdentity => {
          browser.storage.sync.get('lobbiesHistory', objWithHistory => {
            db.ref('lobbies').
                child(message.payload.lobbyId).
                once('value').
                then(lobbyInfo => {
                  objWithHistory.lobbiesHistory[message.payload.lobbyId] = {name: lobbyInfo.val().name};
                  objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity = videoIdentity.val();
                  objWithHistory.lobbiesHistory[message.payload.lobbyId].videoIdentity.link = generateLink(
                      videoIdentity.val());
                  console.log(objWithHistory);
                  browser.storage.sync.set(objWithHistory);
                });

          });
        });
  }

  function setLinkToLobby(linkInfo) {
    db.ref(`videoControllers/${linkInfo.lobbyId}/`).
        update(linkInfo.videoState);
    db.ref(`videos/${linkInfo.lobbyId}`).set(linkInfo.videoIdentity);
  }

  function generateLink(videoIdentity) {
    let url = '';
    switch (videoIdentity.hostname) {
      case 'www.youtube.com': {
        url += 'https://' + videoIdentity.hostname + '/watch?v=' +
            videoIdentity.v;
      }
    }
    return url;
  }

  browser.tabs.onCreated.addListener(tab => {
    addLobbyToHistory(tab);
  });

  browser.tabs.onUpdated.addListener((id, change, tab) => {
    addLobbyToHistory(tab);
  });

  function addLobbyToHistory(tab) {
    if (tab.url.match('chrome-extension://')) return;
    let currentURL = new URL(tab.url);
    if (currentURL.hostname === 'team.watch') {
      browser.tabs.update(
          {url: './loading.html'});
      let lobbyId = currentURL.pathname.slice(1);
      db.ref(`lobbies/${lobbyId}`).
          once('value').
          then(lobbyInfo => {
            db.ref(`users/${userId}/lobbies/${lobbyId}`).
                set({name: lobbyInfo.val().name});
            connectLobby({payload: {lobbyId}});
            db.ref(`videos/${lobbyId}`).
                once('value').
                then(videoIdentity => {
                  browser.tabs.update(
                      {url: generateLink(videoIdentity.val())}, () => {
                        {
                          setTimeout(() => {
                            browser.tabs.sendMessage(
                                tab.id,
                                {
                                  type: SYNC_LOBBY,
                                  payload: {
                                    lobbyId,
                                    videoIdentity: videoIdentity.val(),
                                  },
                                });
                          }, 2000);
                        }
                      });
                });
          });
    }
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
  //   connectedLobbyRef = db.ref(`lobbies/${id}`);
  //   connectedLobbyRef.child('/link').on('value', link => {
  //     console.log(link.val());
  //   });
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
  // function videoMessagesListener(message) {
  //   if (message.playing) {
  //     connectedLobbyRef.child('isPlaying').set(message.playing);
  //   }
  //   else if (message.updateTime) {
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

}
