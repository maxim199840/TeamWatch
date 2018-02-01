import {browser} from '../browserApi';
import {
  CREATE_LOBBY,
  SYNC_WITH_LOBBY,
  UNSYNC_WITH_LOBBY,
  VIDEO_CONTROL,
} from '../messageTypes';

(function() {

  browser.runtime.onMessage.addListener(onCreateLobbyListener);
  browser.runtime.onMessage.addListener(onSyncListener);

  let videoIdentity;
  let lobbyId;
  let port;
  let videoElement;
  let isProgramPlayAction = false;
  let isProgramPauseAction = false;
  let isProgramSeekAction = false;

  function onCreateLobbyListener({type, payload}, sender, isCreatedCallback) {
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

  function onSyncListener({type, payload}, sender, isSyncedCallback) {
    if (type !== SYNC_WITH_LOBBY) return;

    const isTabMatched = matchVideoIdentity(payload.videoIdentity);
    if (!isTabMatched) {
      isSyncedCallback(false);
      return;
    }
    isSyncedCallback(true);

    browser.runtime.onMessage.removeListener(onSyncListener);
    browser.runtime.onMessage.addListener(onUnsyncListener);

    videoIdentity = payload.videoIdentity;
    lobbyId = payload.lobbyId;

    videoElement = document.
        getElementsByClassName('video-stream html5-main-video')[0];

    port = browser.runtime.connect();
    port.onMessage.addListener(onVideoControlListener);
    port.postMessage({
      type: SYNC_WITH_LOBBY,
      payload: {
        lobbyId: payload.lobbyId,
      },
    });

    videoElement.onplay = () => {
      console.log('onplay:', isProgramPlayAction ? 'by program' : 'sended');
      if (isProgramPlayAction) {
        isProgramPlayAction = false;
        return;
      }
      port.postMessage({
        type: VIDEO_CONTROL,
        payload: {
          isPlaying: true,
        },
      });
    };
    videoElement.onpause = () => {
      console.log('onpause:', isProgramPauseAction ? 'by program' : 'sended');
      if (isProgramPauseAction) {
        isProgramPauseAction = false;
        return;
      }
      port.postMessage({
        type: VIDEO_CONTROL,
        payload: {
          isPlaying: false,
          time: videoElement.currentTime,
        },
      });
    };
    videoElement.onseeked = () => {
      console.log('onseeked:', 'sended');
      if (isProgramSeekAction) {
        isProgramSeekAction = false;
      }
      //TODO: function pause
      console.log('pause on seeked from user:',
          videoElement.paused ? 'already paused' : 'success');
      if (!videoElement.paused) {
        isProgramPauseAction = true;
        videoElement.pause();
      }

      port.postMessage({
        type: VIDEO_CONTROL,
        payload: {
          isPlaying: false,
          time: videoElement.currentTime,
        },
      });
    };
  }

  function onUnsyncListener({type, payload}) {
    if (type !== UNSYNC_WITH_LOBBY || lobbyId !== payload.lobbyId) return;

    videoElement.onplay = null;
    videoElement.onpause = null;
    videoElement.onseeked = null;

    port.disconnect();
    port = null;

    browser.runtime.onMessage.removeListener(onUnsyncListener);
    browser.runtime.onMessage.addListener(onSyncListener);
  }

  function onVideoControlListener({type, payload}) {
    if (type !== VIDEO_CONTROL) return;

    if (typeof(payload.isPlaying) === 'boolean') {
      if (payload.isPlaying) {
        //TODO: function play
        console.log('play from firebase:',
            !videoElement.paused ? 'already playing' : 'success');
        if (videoElement.paused) {
          isProgramPlayAction = true;
          videoElement.play();
        }
      } else {
        //TODO: function pause
        console.log('pause from firebase:',
            videoElement.paused ? 'already paused' : 'success');
        if (!videoElement.paused) {
          isProgramPauseAction = true;
          videoElement.pause();
        }
      }
    }
    if (typeof payload.time === 'number') {
      //TODO: function seek
      isProgramSeekAction = true;
      console.log('seek from firebase');
      videoElement.currentTime = payload.time;
    }
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
  }

})();
