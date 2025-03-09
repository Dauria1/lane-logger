const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openNewWindow: () => ipcRenderer.send('open-new-window'),
  refreshStats: () => {
    console.log('Sending refresh-stats event');
    ipcRenderer.send('refresh-stats');
  },
  saveConfig: config => ipcRenderer.send('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  updateLaneVisibility: lanes => ipcRenderer.send('update-lane-visibility', lanes),
  onServerStatus: callback => ipcRenderer.on('server-status', (event, status) => callback(status)),
});
