const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('timeTracker', {
  version: '1.0.0'
});
