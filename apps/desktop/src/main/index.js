const fs = require('fs');
const { app, BrowserWindow, nativeImage, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

let backendInstance = null;

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

const resolveBackendEntry = () => {
  const packagedPath = path.join(app.getAppPath(), 'server', 'index.js');
  if (fs.existsSync(packagedPath)) {
    return packagedPath;
  }

  return path.join(__dirname, '../../server/src/index.js');
};

const startBackend = async () => {
  if (backendInstance) {
    return backendInstance;
  }

  try {
    const backendModule = require(resolveBackendEntry());
    const { startServer } = backendModule;
    backendInstance = await startServer({
      port: process.env.FLOWTIME_BACKEND_PORT
    });
  } catch (error) {
    console.error('[main] Failed to start backend', error);
    backendInstance = null;

    if (app.isPackaged) {
      dialog.showErrorBox(
        'Flowtime Backend',
        'Der integrierte Flowtime-Server konnte nicht gestartet werden. Bitte prüfe, ob der Port bereits belegt ist.'
      );
    }

    throw error;
  }

  return backendInstance;
};

const stopBackend = () => {
  if (backendInstance?.server) {
    backendInstance.server.close();
    backendInstance = null;
  }
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
      enableRemoteModule: false
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

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  if (process.platform === 'darwin') {
    app.dock.setIcon(nativeImage.createFromPath(getIconPath()));
  }

  await startBackend().catch(() => {});
  createMainWindow();

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
  stopBackend();
});
