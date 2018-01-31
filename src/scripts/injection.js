import {browser} from '../browserApi';
import {
  SYNC_WITH_LOBBY,
  UNSYNC_WITH_LOBBY,
  VIDEO_CONTROL,
} from '../messageTypes';

(function() {

  browser.runtime.onMessage.addListener(onSyncListener);

  let videoIdentity;
  let lobbyId;
  let port;
  let videoElement;
  let isProgramPlayAction = false;
  let isProgramPauseAction = false;
  let isProgramSeekAction = false;

  function onSyncListener({type, payload}, sender, responseCallback) {
    if (type !== SYNC_WITH_LOBBY) return;

    const isTabMatched = checkVideoIdentityMatch(payload.videoIdentity);
    if (!isTabMatched) {
      responseCallback(false);
      return;
    }
    responseCallback(true);

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
      if (isProgramSeekAction) {
        isProgramSeekAction = false;
        return;
      }
      isProgramPauseAction = true;
      videoElement.pause();
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

    const {isPlaying, time} = payload;
    if (typeof(isPlaying) === 'boolean') {
      if (isPlaying) {
        isProgramPlayAction = true;
        videoElement.play();
      } else {
        isProgramPauseAction = true;
        videoElement.pause();
      }
    }
    if (typeof time === 'number') {
      isProgramSeekAction = true;
      videoElement.currentTime = time;
    }
  }

  function checkVideoIdentityMatch(videoIdentity) {
    const url = new URL(document.location.href);
    if (url.hostname === videoIdentity.hostname) {
      return url.searchParams.get('v') === videoIdentity.v;
    }
  }

})();
