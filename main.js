require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs').promises;
const { startServer } = require('./server');

let server = null;
let currentConfig = null;

async function loadConfig() {
  try {
    const data = await fs.readFile(path.join(app.getPath('userData'), 'config.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function saveConfig(config) {
  try {
    await fs.writeFile(
      path.join(app.getPath('userData'), 'config.json'),
      JSON.stringify(config, null, 2)
    );
    currentConfig = config;
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    icon: path.join(__dirname, 'assets', 'lane-logger.png'), // Window icon
    webPreferences: {
      preload: path.join(__dirname, 'preload-main.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
}

function createSecondWindow() {
  if (!server) {
    server = startServer();
    BrowserWindow.getAllWindows()[0].webContents.send('server-status', 'running');
  }

  const secondWindow = new BrowserWindow({
    width: 300,
    height: 200,
    movable: true,
    resizable: false,
    icon: path.join(__dirname, 'assets', 'lane-logger.png'), // Window icon
    webPreferences: {
      preload: path.join(__dirname, 'preload-overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  secondWindow.loadFile('overlay.html');

  secondWindow.on('closed', () => {
    if (server) {
      server.close(() => {
        server = null;
        BrowserWindow.getAllWindows()[0].webContents.send('server-status', 'stopped');
      });
    }
  });
}

app.whenReady().then(async () => {
  createWindow();

  // Load initial config
  currentConfig = await loadConfig();

  ipcMain.handle('load-config', async () => currentConfig);

  ipcMain.on('save-config', async (event, config) => {
    try {
      await saveConfig(config);
    } catch (error) {
      console.error('Error saving config:', error);
      event.reply('save-config-error', error.message);
    }
  });

  ipcMain.on('open-new-window', () => {
    createSecondWindow();
  });

  ipcMain.on('update-lane-visibility', (event, lanes) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send('lane-visibility-changed', lanes);
    });
  });

  ipcMain.on('refresh-stats', () => {
    console.log('Main process received refresh-stats event');
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      console.log('Window title:', window.webContents.getTitle());
      window.webContents.send('refresh-stats');
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close(() => {
        console.log('Server closed successfully');
        app.quit();
      });
    } else {
      app.quit();
    }
  }
});
