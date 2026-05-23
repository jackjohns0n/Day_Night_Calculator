/**
 * preload.js
 *
 * Fix #1: This is the secure contextIsolation bridge.
 * It exposes ONLY the specific IPC channels the renderer needs —
 * nothing else from Node.js or Electron is accessible to the HTML pages.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Send calculation request to main process
    calculate: (data) => ipcRenderer.send('item:calculate', data),

    // Send clear request
    clear: () => ipcRenderer.send('item:clear'),

    // Request app version
    getVersion: () => ipcRenderer.send('app_version'),

    // Restart for update
    restartApp: () => ipcRenderer.send('restart_app'),

    // Resize the window
    resizeWindow: (size) => ipcRenderer.send('resize_window', size),
    onResult: (callback) => ipcRenderer.on('item:result', (e, data) => callback(data)),
    onError: (callback) => ipcRenderer.on('item:error', (e, msg) => callback(msg)),
    onClear: (callback) => ipcRenderer.on('item:clear', () => callback()),
    onVersion: (callback) => ipcRenderer.on('app_version', (e, arg) => callback(arg)),
    onUpdateAvailable: (callback) => ipcRenderer.on('update_available', () => callback()),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', () => callback()),

    // Cleanup helpers
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
