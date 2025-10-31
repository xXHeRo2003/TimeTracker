const { contextBridge, ipcRenderer } = require('electron');

const api = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  history: {
    listEntries: () => ipcRenderer.invoke('history:list'),
    addEntry: (entry) => ipcRenderer.invoke('history:add', entry),
    deleteEntry: (id) => ipcRenderer.invoke('history:delete', id),
    clearEntries: () => ipcRenderer.invoke('history:clear'),
    getDatabasePath: () => ipcRenderer.invoke('history:getDatabasePath')
  }
};

contextBridge.exposeInMainWorld('timeTracker', api);
