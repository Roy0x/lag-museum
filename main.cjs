const { app, BrowserWindow, session } = require('electron');
const { join } = require('node:path');
const { bindSmartSpectraIpc } = require('@smartspectra/node-sdk/main');

function makeWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 670,
    backgroundColor: '#080d17',
    autoHideMenuBar: true,
    webPreferences: {
      preload: require.resolve('@smartspectra/node-sdk/preload'),
      contextIsolation: true, sandbox: true, nodeIntegration: false,
    },
  });
  bindSmartSpectraIpc(win);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
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
