import {browser} from '../browserApi';
import {
  CREATE_LOBBY,
  SYNC_WITH_LOBBY,
  UNSYNC_WITH_LOBBY,
  VIDEO_CONTROL,
} from '../messageTypes';

console.info('Team Watch injected..');

(function() {

  browser.runtime.onMessage.addListener(onCreateLobby);
  browser.runtime.onMessage.addListener(onSync);

  let videoIdentity;
  let lobbyId;
  let port;
  let video;
  let isProgramPlayAction = false;
  let isProgramPauseAction = false;
  let isProgramSeekAction = false;

  function onCreateLobby({type, payload}, sender, isCreatedCallback) {
    if (type !== CREATE_LOBBY) return;

    const videoIdentity = createVideoIdentity();

    if (!videoIdentity) {
      isCreatedCallback(false);
    }
    isCreatedCallback(true);

    browser.runtime.sendMessage({
      type: CREATE_LOBBY,
      payload: {
        name: payload.name,
        videoIdentity,
      },
    });
  }

  function onSync({type, payload}, sender, isSyncedCallback) {
    if (type !== SYNC_WITH_LOBBY) return;

    const isVideoIdentityMatched = matchVideoIdentity(payload.videoIdentity);
    if (!isVideoIdentityMatched) {
      isSyncedCallback(false);
      return;
    }
    isSyncedCallback(true);

    browser.runtime.onMessage.removeListener(onSync);
    browser.runtime.onMessage.addListener(onUnsync);

    videoIdentity = payload.videoIdentity;
    lobbyId = payload.lobbyId;

    video = document.
        getElementsByClassName('video-stream html5-main-video')[0];

    port = browser.runtime.connect();
    port.onMessage.addListener(onVideoControl);
    port.postMessage({
      type: SYNC_WITH_LOBBY,
      payload: {
        lobbyId: payload.lobbyId,
      },
    });

    video.onplay = () => {
      if (isProgramPlayAction) {
        console.log('Play is triggered by program.');
        isProgramPlayAction = false;
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
      if (isProgramPauseAction) {
        console.log('Pause is triggered by program.');
        isProgramPauseAction = false;
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
      if (isProgramSeekAction) {
        isProgramSeekAction = false;
        return;
      }

      const payload = {
        isPlaying: false,
        time: video.currentTime,
      };
      console.log('Seek triggered and send to eventPage:', payload);
      port.postMessage({type: VIDEO_CONTROL, payload});

      if (!video.paused) {
        console.log('Trigger pause because video is not paused.');
        isProgramPauseAction = true;
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

  function onVideoControl({type, payload}) {
    if (type !== VIDEO_CONTROL) return;

    console.log('From eventPage:', payload);

    if (payload.hasOwnProperty('isPlaying')) {
      if (payload.isPlaying) {
        if (video.paused) {
          isProgramPlayAction = true;
          video.play();
        }
      } else {
        if (!video.paused) {
          isProgramPauseAction = true;
          video.pause();
        }
      }
    }
    if (payload.hasOwnProperty('time')) {
      isProgramSeekAction = true;
      video.currentTime = payload.time;
    }
  }

  function onUnsync({type, payload}) {
    if (type !== UNSYNC_WITH_LOBBY || lobbyId !== payload.lobbyId) return;

    video.onplay = null;
    video.onpause = null;
    video.onseeked = null;

    port.onMessage.removeListener(onVideoControl);
    port.disconnect();
    port = null;

    video = null;

    browser.runtime.onMessage.removeListener(onUnsync);
    browser.runtime.onMessage.addListener(onSync);
  }

})();
