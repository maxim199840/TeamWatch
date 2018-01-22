class StorageController {
  set onChange(callback) {
    if (callback === null) {
      chrome.storage.onChanged.removeListener(this.callback);
    }
    this.callback = callback;
    chrome.storage.onChanged.addListener(callback);
  }

  getAsyncStorage(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, data => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }
        resolve(data);
      });
    });
  }

  setAsyncStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }
}

export {
  StorageController,
};
export let storageController = new StorageController();
