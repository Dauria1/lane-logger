const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onRefreshStats: callback => ipcRenderer.on('refresh-stats', () => callback()),
  onLaneVisibilityChanged: callback =>
    ipcRenderer.on('lane-visibility-changed', (event, lanes) => callback(lanes)),
});
