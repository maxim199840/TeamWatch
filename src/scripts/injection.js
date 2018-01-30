import {browser} from '../browserApi';
import {LINK_WITH_LOBBY, VIDEO_CONTROL} from '../messageTypes';

(function() {

  browser.runtime.onMessage.addListener(onMessage);

  let video;

  function onMessage({type, payload}, sender, responseCallback) {
    switch (type) {
      case LINK_WITH_LOBBY: {
        const isTabMatched = checkVideoIdentityMatch(payload.videoIdentity);
        if (!isTabMatched) {
          responseCallback(false);
          return;
        }
        responseCallback(true);

        video = document.
            getElementsByClassName('video-stream html5-main-video')[0];
        const port = browser.runtime.connect();
        port.onMessage.addListener(onMessage);
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
            time: video.currentTime,
          },
        });

        break;
      }
      case VIDEO_CONTROL: {
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
        break;
      }
    }
  }

  function checkVideoIdentityMatch(videoIdentity) {
    const url = new URL(document.location.href);
    if (url.hostname === videoIdentity.hostname) {
      return url.searchParams.get('v') === videoIdentity.v;
    }
  }

})();
