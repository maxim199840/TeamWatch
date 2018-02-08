import {browser} from '../browserApi';
import {
  CREATE_LOBBY,
  SYNC_LOBBY,
  UNSYNC_LOBBY,
  VIDEO_CONTROL,
} from '../messageTypes';

console.info('Team Watch injected..');

(function() {

  let lobbyId;
  let videoIdentity;
  let port;
  let video;
  let programPlayAction;
  let programPauseAction;
  let programSeekAction;

  window.onhashchange = () => {
    reset();
  };

  init();

  function init() {
    lobbyId = null;
    videoIdentity = null;
    port = null;
    video = null;
    programPlayAction = false;
    programPauseAction = false;
    programSeekAction = false;

    browser.runtime.onMessage.addListener(onCreateLobby);
    browser.runtime.onMessage.addListener(onSync);
  }

  function onCreateLobby({type, payload}, sender, isCreatedCallback) {
    if (type !== CREATE_LOBBY) return;

    videoIdentity = createVideoIdentity();

    if (!videoIdentity) {
      isCreatedCallback(false);
    }
    isCreatedCallback(true);

    browser.runtime.onMessage.removeListener(onCreateLobby);
    browser.runtime.onMessage.removeListener(onSync);

    video = getVideo();

    port = browser.runtime.connect();
    port.onDisconnect.addListener(reset);

    port.onMessage.addListener(onCreatedLobbyIdGenerated);

    port.postMessage({
      type: CREATE_LOBBY,
      payload: {
        name: document.getElementsByClassName('title')[0].innerHTML,
        videoIdentity,
        videoState: {
          isPlaying: !video.paused,
          time: video.currentTime,
        },
      },
    });
  }

  function onCreatedLobbyIdGenerated({type, payload}) {
    if (type !== CREATE_LOBBY) return;

    port.onMessage.removeListener(onCreatedLobbyIdGenerated);

    lobbyId = payload.lobbyId;

    port.onMessage.addListener(onVideoControl);

    port.postMessage({
      type: SYNC_LOBBY,
      payload: {lobbyId},
    });

    setVideoEventCallbacks();

    browser.runtime.onMessage.addListener(onUnsync);
  }

  function onSync({type, payload}, sender, isSyncedCallback) {
    if (type !== SYNC_LOBBY) return;

    const isVideoIdentityMatched = matchVideoIdentity(payload.videoIdentity);
    if (!isVideoIdentityMatched) {
      isSyncedCallback(false);
      return;
    }
    isSyncedCallback(true);

    browser.runtime.onMessage.removeListener(onCreateLobby);
    browser.runtime.onMessage.removeListener(onSync);

    videoIdentity = payload.videoIdentity;
    lobbyId = payload.lobbyId;

    video = getVideo();

    if (!port) {
      port = browser.runtime.connect();
      port.onDisconnect.addListener(reset);
    }

    port.onMessage.addListener(onVideoControl);

    port.postMessage({
      type: SYNC_LOBBY,
      payload: {
        lobbyId,
        title: document.title,
      },
    });

    setVideoEventCallbacks();

    browser.runtime.onMessage.addListener(onUnsync);
  }

  function setVideoEventCallbacks() {
    video.onplay = () => {
      if (programPlayAction) {
        console.log('Play is triggered by program.');
        programPlayAction = false;
        return;
      }

      const payload = {
        isPlaying: true,
      };
      console.
          log('Play is triggered by player and send to eventPage:', payload);
      port.postMessage({
        type: VIDEO_CONTROL,
        payload,
      });
    };

    video.onpause = () => {
      if (programPauseAction) {
        console.log('Pause is triggered by program.');
        programPauseAction = false;
        return;
      }

      const payload = {
        isPlaying: false,
        time: video.currentTime,
      };
      console.
          log('Pause is triggered by player and send to eventPage:', payload);
      port.postMessage({type: VIDEO_CONTROL, payload});
    };

    video.onseeked = () => {
      if (programSeekAction) {
        programSeekAction = false;
      }

      const payload = {
        isPlaying: false,
        time: video.currentTime,
      };
      console.log('Seek triggered and send to eventPage:', payload);
      port.postMessage({type: VIDEO_CONTROL, payload});

      if (!video.paused) {
        console.log('Trigger pause because video is not paused.');
        programPauseAction = true;
        video.pause();
      }
    };
  }

  function createVideoIdentity() {
    const url = new URL(document.location.href);
    const hostname = url.hostname;
    if (hostname === 'www.youtube.com') {
      const v = url.searchParams.get('v');
      if (v) return {hostname, v};
    }
    return null;
  }

  function matchVideoIdentity(videoIdentity) {
    const url = new URL(document.location.href);
    if (url.hostname === videoIdentity.hostname) {
      return url.searchParams.get('v') === videoIdentity.v;
    }
    return false;
  }

  function getVideo() {
    return document.getElementsByClassName('video-stream html5-main-video')[0];
  }

  function onVideoControl({type, payload}) {
    if (type !== VIDEO_CONTROL) return;

    console.log('From eventPage:', payload);

    if (payload.hasOwnProperty('isPlaying')) {
      if (payload.isPlaying) {
        if (video.paused) {
          programPlayAction = true;
          video.play();
        }
      } else {
        if (!video.paused) {
          programPauseAction = true;
          video.pause();
        }
      }
    }
    if (payload.hasOwnProperty('time')) {
      programSeekAction = true;
      video.currentTime = payload.time;
    }
  }

  function onUnsync({type, payload}) {
    if (type !== UNSYNC_LOBBY || lobbyId !== payload.lobbyId) return;

    reset();
  }

  function reset() {
    browser.runtime.onMessage.removeListener(onUnsync);
    browser.runtime.onMessage.removeListener(onCreatedLobbyIdGenerated);
    browser.runtime.onMessage.removeListener(onVideoControl);

    if (video) {
      video.onplay = null;
      video.onpause = null;
      video.onseeked = null;
    }

    if (port) port.disconnect();

    init();
  }

})();
