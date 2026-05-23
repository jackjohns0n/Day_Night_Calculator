const electron = require('electron');
const url = require('url');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu').default;

const { app, BrowserWindow, Menu, ipcMain } = electron;

// Set Environment via NODE_ENV — do NOT hardcode here.
// Set NODE_ENV=development in your npm start script for dev tools.
// e.g. "start": "cross-env NODE_ENV=development electron ."

// Enable right-click context menu with copy/paste/select all throughout the app
contextMenu({
    showSaveImageAs: false,
    showInspectElement: process.env.NODE_ENV !== 'production'
});

let mainWindow;

// ─── Main Window ────────────────────────────────────────────────────────────

app.on('ready', function () {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 600,
        minWidth: 600,
        minHeight: 520,
        title: 'Miscalculator',
        webPreferences: {
            // Fix #1: nodeIntegration OFF, contextIsolation ON, use preload
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', function () {
        app.quit();
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

// ─── IPC Handlers ───────────────────────────────────────────────────────────

// Fix #2: Properly declared variables — no more accidental globals
let dayScaleS = null;

// Fix #3: Input validation + Fix #2: declared vars + Fix #10: try/catch
ipcMain.on('item:calculate', function (e, data) {
    try {
        const dayHours = parseFloat(data.day);
        const nightHours = parseFloat(data.night);

        // Validate inputs
        if (isNaN(dayHours) || dayHours <= 0) {
            mainWindow.webContents.send('item:error', 'Day time must be a positive number.');
            return;
        }
        if (isNaN(nightHours) || nightHours <= 0) {
            mainWindow.webContents.send('item:error', 'Night time must be a positive number.');
            return;
        }

        const desiredDayMin = 60 * dayHours;
        dayScaleS = 780 / desiredDayMin;
        const dayScaleDecimal = parseFloat(dayScaleS.toFixed(2));

        const desiredNightMin = 60 * nightHours;
        const nightScaleS = (660 / desiredNightMin) / dayScaleS;
        const nightScaleDecimal = parseFloat(nightScaleS.toFixed(2));

        mainWindow.webContents.send('item:result', {
            day: dayScaleDecimal,
            night: nightScaleDecimal,
            dayHours,
            nightHours
        });

    } catch (err) {
        console.error('Calculation error:', err);
        mainWindow.webContents.send('item:error', 'An unexpected error occurred. Please try again.');
    }
});

ipcMain.on('resize_window', function (e, size) {
    if (mainWindow) {
        mainWindow.setSize(size.width, size.height, true); // true = animate
    }
});

ipcMain.on('item:clear', function () {
    dayScaleS = null;
    if (mainWindow) {
        mainWindow.webContents.send('item:clear');
    }
});

ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

// ─── Menu Template ──────────────────────────────────────────────────────────

const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Start Over',
                accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
                click() {
                    if (mainWindow) {
                        mainWindow.webContents.send('item:clear');
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    }
];

// Fix #8: NODE_ENV is no longer hardcoded — dev tools will actually show in dev
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    if (focusedWindow) focusedWindow.toggleDevTools();
                }
            },
            { role: 'reload' }
        ]
    });
}

if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

// ─── Auto Updater ───────────────────────────────────────────────────────────

autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update_downloaded');
});
