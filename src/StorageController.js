class StorageController {
  getAsyncStorage(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, data => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }
        resolve(data);
      });
    });
  }

  setAsyncStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }
}

export let storageController = new StorageController();