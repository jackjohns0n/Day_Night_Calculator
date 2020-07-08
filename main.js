const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let dayWindow;
let nightWindow

// Listen for app to be ready
app.on('ready', function(){
    // Create new window
    mainWindow = new BrowserWindow({webPreferences: {nodeIntegration: true}});
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
    mainWindow.webContents.send('item:day', dayScaleS);
    console.log(dayScaleS)
    dayWindow.close();
});

// Catch item:night
ipcMain.on('item:night', function night(e, item){
    console.log(item);
    DesiredNightMin = (60 * item);
    nightScaleS = (660 / DesiredNightMin) / dayScaleS;
    mainWindow.webContents.send('item:night', nightScaleS);
    console.log(nightScaleS)
    nightWindow.close();
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