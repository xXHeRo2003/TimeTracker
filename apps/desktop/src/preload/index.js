const { contextBridge, ipcRenderer } = require('electron');

const api = {
  getVersion: () => ipcRenderer.invoke('app:getVersion')
};

contextBridge.exposeInMainWorld('timeTracker', api);
