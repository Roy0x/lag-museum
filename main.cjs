const { app, BrowserWindow, session, shell, ipcMain } = require('electron');
const { join } = require('node:path');
const { bindSmartSpectraIpc } = require('@smartspectra/node-sdk/main');
const { SmartSpectraSDK, breathingMetrics, cardioMetrics } = require('@smartspectra/node-sdk');

let readinessRunning = false;
ipcMain.handle('lag-museum:check-device-readiness', async (event, apiKey) => {
  if (!event.senderFrame.url.startsWith('file://')) throw new Error('Readiness request denied.');
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('A SmartSpectra API key is required for readiness.');
  if (readinessRunning) return { verdict: 'inconclusive', reason: 'A readiness check is already running.' };
  readinessRunning = true;
  try {
    // The renderer SDK owns the key and measurement camera. This separate SDK
    // instance performs only the documented preflight after the local probe.
    const sdk = new SmartSpectraSDK({ apiKey, requestedMetrics: [...breathingMetrics, ...cardioMetrics], enableTelemetry: false });
    try {
      sdk.useCamera();
      return await sdk.checkDeviceReadiness();
    } finally {
      await sdk.destroy();
    }
  } finally {
    readinessRunning = false;
  }
});

function makeWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 670,
    backgroundColor: '#080d17',
    autoHideMenuBar: true,
    webPreferences: {
      // The custom preload composes the native SmartSpectra preload with our
      // contextBridge. Electron's sandboxed preload cannot require arbitrary
      // Node packages, so keep isolation ON but the preload sandbox OFF.
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true, sandbox: false, nodeIntegration: false,
    },
  });
  bindSmartSpectraIpc(win);
  win.webContents.setWindowOpenHandler(({ url }) => { if (url === 'https://physiology.presagetech.com/' || url === 'https://physiology.presagetech.com') void shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  // Browsers may also enforce Windows OS-level camera privacy controls.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    const url = details?.requestingUrl || wc.getURL();
    callback(permission === 'media' && url.startsWith('file://') && wc.getURL().startsWith('file://'));
  });
  makeWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) makeWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
