export class Messenger {
  constructor(name) {
    this.port = chrome.runtime.connect({name});
  }

  send(message) {
    this.port.postMessage(message);
  }

  addListener(callback) {
    this.port.onMessage.addListener(callback);
  }

  removeListener(callback) {
    this.port.onMessage.removeListener(callback);
  }
}
