const electron = require('electron');
const url = require('url');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const {app, BrowserWindow, Menu, ipcMain} = electron;

// Set Environment
process.env.NODE_ENV = "production";

let mainWindow;
let dayWindow;
let nightWindow

// Listen for app to be ready
app.on('ready', function(){
    // Create new window and check for update
    mainWindow = new BrowserWindow({webPreferences: {nodeIntegration: true}});
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
      });
    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle create day window
function createDayWindow(){
    // Create new window
    dayWindow = new BrowserWindow({
        width: 400,
        height: 200,
        title: 'Desired Day Time Length (IRL Time)',
        webPreferences: {nodeIntegration: true}
    });
    // Load html into window
    dayWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'dayWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    //Garbage Collection
    dayWindow.on('close', function(){
        dayWindow = null;
    });
}

// Handle create night window
function createNightWindow(){
    // Create new window
    nightWindow = new BrowserWindow({
        width: 400,
        height: 200,
        title: 'Desired Night Time Length (IRL Time)',
        webPreferences: {nodeIntegration: true}
    });
    // Load html into window
    nightWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'nightWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    //Garbage Collection
    nightWindow.on('close', function(){
        nightWindow = null;
    });
}

// Catch item:day
ipcMain.on('item:day', function day(e, item){
    console.log(item);
    DesiredDayMin = (60 * item);
    dayScaleS = (780 / DesiredDayMin);
    dayScaleSdecimal = dayScaleS.toFixed(2);
    mainWindow.webContents.send('item:day', dayScaleSdecimal);
    console.log(dayScaleS)
    console.log(dayScaleSdecimal)
    dayWindow.close();
});

// Catch item:night
ipcMain.on('item:night', function night(e, item){
    console.log(item);
    DesiredNightMin = (60 * item);
    nightScaleS = (660 / DesiredNightMin) / dayScaleS;
    nightScaleSdecimal = nightScaleS.toFixed(2);
    mainWindow.webContents.send('item:night', nightScaleSdecimal);
    console.log(nightScaleS)
    console.log(nightScaleSdecimal)
    nightWindow.close();
});

// Catch App version number
ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
  });

// Create menu template
const mainMenuTemplate = [
    {
        label:'File',
        submenu:[
            {
                label: 'Desired Day Time Length (IRL Time)',
                accelerator: process.platform == 'darwin' ? 'Command+D' : 'Ctrl+D',
                click(){
                    createDayWindow();
                }
            },
            {
                label: 'Desired Night Time Length (IRL Time)',
                accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
                click(){
                    createNightWindow();
                }
            },
            {
                label: 'Start Over',
                click(){
                    mainWindow.webContents.send('item:clear');
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

//If mac, add empty object to menu
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

//Add Developer Tools item if not in production
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

// Auto-Updater
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });
autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });

// Install and restart app if selected
  ipcMain.on('restart_app', () => {
   autoUpdater.quitAndInstall();
  });