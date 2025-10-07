const { app, BrowserWindow, nativeImage, Menu } = require('electron');
const path = require('path');

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
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  mainWindow.loadFile(path.join(__dirname, '../renderer/pages/index.html'));

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
