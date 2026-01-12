const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    scanGames: () => ipcRenderer.invoke('scan-games'),
    fetchCovers: (games) => ipcRenderer.invoke('fetch-covers', games),
    launchGame: (exePath, isCommand, gameId) => {
        console.log('🔌 Preload: Sending launch-game IPC', { exePath, gameId });
        return ipcRenderer.invoke('launch-game', exePath, isCommand, gameId);
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
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
