import {browser} from '../browserApi';
import {LINK_WITH_LOBBY, VIDEO_CONTROL} from '../messageTypes';

(function() {

  browser.runtime.onMessage.addListener(onSyncListener);

  let videoIdentity;
  let lobbyId;
  let video;

  function onSyncListener({type, payload}, sender, responseCallback) {
    if (type !== LINK_WITH_LOBBY) return;

    const isTabMatched = checkVideoIdentityMatch(payload.videoIdentity);
    if (!isTabMatched) {
      responseCallback(false);
      return;
    }
    responseCallback(true);

    browser.runtime.onMessage.removeListener(onSyncListener);

    videoIdentity = payload.videoIdentity;
    lobbyId = payload.lobbyId;

    console.log(videoIdentity, lobbyId);

    video = document.getElementsByClassName('video-stream html5-main-video')[0];

    const port = browser.runtime.connect();
    port.onMessage.addListener(onVideoControlListener);
    port.postMessage({
      type: LINK_WITH_LOBBY,
      payload: {
        lobbyId: payload.lobbyId,
      },
    });

    video.onplay = () => port.postMessage({
      type: VIDEO_CONTROL,
      payload: {
        isPlaying: true,
      },
    });
    video.onpause = () => port.postMessage({
      type: VIDEO_CONTROL,
      payload: {
        isPlaying: false,
      },
    });
    video.onseeked = () => port.postMessage({
      type: VIDEO_CONTROL,
      payload: {
        isPlaying: false,
        time: video.currentTime,
      },
    });
  }

  function onVideoControlListener({type, payload}) {
    if (type !== VIDEO_CONTROL) return;

    const {isPlaying, time} = payload;
    if (typeof(isPlaying) === 'boolean') {
      if (isPlaying) {
        video.play();
      } else {
        video.pause();
      }
    }
    if (typeof time === 'number') {
      video.currentTime = time;
    }
  }

  function checkVideoIdentityMatch(videoIdentity) {
    const url = new URL(document.location.href);
    if (url.hostname === videoIdentity.hostname) {
      return url.searchParams.get('v') === videoIdentity.v;
    }
  }

})();
