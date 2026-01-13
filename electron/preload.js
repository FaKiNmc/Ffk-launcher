const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.invoke('get-version'),
    scanGames: () => ipcRenderer.invoke('scan-games'),
    fetchCovers: (games) => ipcRenderer.invoke('fetch-covers', games),
    launchGame: (exePath, isCommand, gameId, requiresRiotClient, useShellLaunch) => {
        console.log('🔌 Preload: Sending launch-game IPC', { exePath, gameId, requiresRiotClient, useShellLaunch });
        return ipcRenderer.invoke('launch-game', exePath, isCommand, gameId, requiresRiotClient, useShellLaunch);
    },
    openLauncher: (launcher) => ipcRenderer.invoke('open-launcher', launcher),

    // Window controls
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),

    // Utilities
    selectFile: () => ipcRenderer.invoke('select-file'),
    saveCustomGame: (game) => ipcRenderer.invoke('save-custom-game', game),
    deleteCustomGame: (gameId) => ipcRenderer.invoke('delete-custom-game', gameId),
    saveCustomCover: (gameId, url) => ipcRenderer.invoke('save-custom-cover', gameId, url),
    // Updates
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Update Events
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (_, err) => callback(err))
});
