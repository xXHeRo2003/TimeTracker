const { app, BrowserWindow, nativeImage, Menu, ipcMain } = require('electron');
const path = require('path');

const {
  insertEntry,
  listEntries,
  deleteEntry,
  clearEntries,
  closeDatabase,
  databaseFile
} = require('./historyStore');

let ipcRegistered = false;

const getIconPath = () => {
  const resourcesDir = app.isPackaged
    ? path.join(process.resourcesPath, 'icons')
    : path.join(__dirname, '../../resources/icons');

  if (process.platform === 'win32') {
    return path.join(resourcesDir, 'app-icon.ico');
  }

  if (process.platform === 'darwin') {
    return path.join(resourcesDir, 'app-icon.icns');
  }

  return path.join(resourcesDir, 'app-icon.png');
};

const registerIpcHandlers = () => {
  if (ipcRegistered) {
    return;
  }

  ipcMain.handle('history:list', () => listEntries());
  ipcMain.handle('history:add', (_event, payload) => insertEntry(payload));
  ipcMain.handle('history:delete', (_event, id) => deleteEntry(id));
  ipcMain.handle('history:clear', async () => {
    await clearEntries();
    return true;
  });

  ipcMain.handle('history:getDatabasePath', () => databaseFile);

  ipcRegistered = true;
};

const createMainWindow = () => {
  const iconPath = getIconPath();
  const iconImage = nativeImage.createFromPath(iconPath);
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#111217',
    icon: iconImage.isEmpty() ? iconPath : iconImage,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      sandbox: true,
      enableRemoteModule: false,
      backgroundThrottling: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  mainWindow.loadFile(path.join(__dirname, '../renderer/pages/index.html'));

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
};

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  if (process.platform === 'darwin') {
    app.dock.setIcon(nativeImage.createFromPath(getIconPath()));
  }

  createMainWindow();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase().catch((error) => {
    console.warn('[main] Failed to close database before quit', error);
  });
});
