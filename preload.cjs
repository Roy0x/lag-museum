require('@smartspectra/node-sdk/preload');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lagMuseum', {
  checkDeviceReadiness: (apiKey) => ipcRenderer.invoke('lag-museum:check-device-readiness', apiKey),
});
