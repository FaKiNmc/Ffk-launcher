import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanAllGames } from './scanners/index.js';
import { enrichGamesWithCovers } from './scanners/covers.js';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

// Fix for duplicate taskbar icons on Windows - MUST BE AT TOP
if (process.platform === 'win32') {
    app.setAppUserModelId('com.isar.fklauncher');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        backgroundColor: '#050505',
        title: "FKLauncher",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Load from dev server or production build
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    setupUpdater(mainWindow);
}

app.whenReady().then(createWindow);

// Force restart
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Custom Games Storage
const customGamesPath = path.join(app.getPath('userData'), 'custom-games.json');

function loadCustomGames() {
    try {
        if (fs.existsSync(customGamesPath)) {
            return JSON.parse(fs.readFileSync(customGamesPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading custom games:', e);
    }
    return [];
}

function saveCustomGames(games) {
    try {
        fs.writeFileSync(customGamesPath, JSON.stringify(games, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving custom games:', e);
        return false;
    }
}

// Custom Covers Storage
const customCoversPath = path.join(app.getPath('userData'), 'custom-covers.json');

function loadCustomCovers() {
    try {
        if (fs.existsSync(customCoversPath)) {
            return JSON.parse(fs.readFileSync(customCoversPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading custom covers:', e);
    }
    return {};
}

function saveCustomCovers(covers) {
    try {
        fs.writeFileSync(customCoversPath, JSON.stringify(covers, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving custom covers:', e);
        return false;
    }
}

// IPC Handlers
ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('scan-games', async () => {
    const results = await scanAllGames();
    results.custom = loadCustomGames(); // Load persisted custom games
    return results;
});

ipcMain.handle('save-custom-game', async (event, newGame) => {
    const currentGames = loadCustomGames();
    currentGames.push(newGame);
    return saveCustomGames(currentGames);
});

ipcMain.handle('delete-custom-game', async (event, gameId) => {
    const currentGames = loadCustomGames();
    const newGames = currentGames.filter(g => g.id !== gameId);
    return saveCustomGames(newGames);
});

ipcMain.handle('save-custom-cover', async (event, gameId, coverUrl) => {
    const covers = loadCustomCovers();
    if (coverUrl) {
        covers[gameId] = coverUrl;
    } else {
        delete covers[gameId]; // Remove override if empty
    }
    return saveCustomCovers(covers);
});

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Ejecutables', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] },
            { name: 'Todos los archivos', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

// Fetch covers for games (runs in background after initial scan)
ipcMain.handle('fetch-covers', async (event, games) => {
    try {
        let gamesWithCovers = await enrichGamesWithCovers(games);

        // Apply custom overrides
        const customCovers = loadCustomCovers();
        gamesWithCovers = gamesWithCovers.map(game => {
            if (customCovers[game.id]) {
                return { ...game, coverUrl: customCovers[game.id] };
            }
            return game;
        });

        return gamesWithCovers;
    } catch (error) {
        console.error('Cover fetch error:', error);
        return games;
    }
});

ipcMain.handle('launch-game', async (event, exePath, isCommand, gameId, requiresRiotClient, useShellLaunch) => {
    // 1. Log to console for debugging
    console.log(`🔵 Launching: ${exePath} (ID: ${gameId}, Shell: ${useShellLaunch})`);

    try {
        // Fallback: Riot game without RiotClientServices - try protocol with game args
        if (requiresRiotClient) {
            console.log('⚠️ RiotClientServices not found, using protocol fallback with game args');

            // Try to extract game product from the exePath (which contains the game exe path)
            // Detect which game it is based on the path
            let productId = '';
            const pathLower = exePath.toLowerCase();
            if (pathLower.includes('valorant')) productId = 'valorant';
            else if (pathLower.includes('league')) productId = 'league_of_legends';
            else if (pathLower.includes('lor')) productId = 'bacon'; // LoR uses 'bacon' internally

            // Open Riot Client via protocol with launch args - may auto-start the game
            const protocolUrl = productId
                ? `riotclient://--launch-product=${productId} --launch-patchline=live`
                : 'riotclient://';

            console.log(`🚀 Protocol fallback: ${protocolUrl}`);
            await shell.openExternal(protocolUrl);
            return { success: true, fallback: true };
        }

        // Use PowerShell Start-Process for Riot games (handles permissions better)
        if (useShellLaunch) {
            const { exec } = await import('child_process');

            // Parse the command: "path\to\exe.exe" --arg1 --arg2
            const match = exePath.match(/^"([^"]+)"\s*(.*)?$/);
            if (match) {
                const exeFile = match[1];
                const args = match[2] || '';

                // Use PowerShell with proper escaping
                const psCommand = args
                    ? `powershell -Command "Start-Process -FilePath '${exeFile}' -ArgumentList '${args}'"`
                    : `powershell -Command "Start-Process -FilePath '${exeFile}'"`;

                console.log(`🚀 Using PowerShell: ${psCommand}`);
                exec(psCommand, (error) => {
                    if (error) {
                        console.error('PowerShell launch error:', error);
                    }
                });
            } else {
                // Fallback: just try to run it directly
                console.log('⚠️ Could not parse command, using direct exec');
                const { exec: execDirect } = await import('child_process');
                execDirect(exePath);
            }
            return { success: true };
        }

        // Check if it's a command with arguments (e.g., Riot games)
        if (isCommand || exePath.startsWith('"')) {
            const { exec } = await import('child_process');
            exec(exePath, (error) => {
                if (error) {
                    console.error('Command launch error:', error);
                }
            });
            // We don't track commands/scripts accurately yet
            return { success: true };
        }

        // Check if it's a protocol URL (steam://, epic://, etc.)
        if (exePath.includes('://')) {
            console.log('⚠️ Protocol URL - Tracking skipped (Steam/Epic internal)');
            await shell.openExternal(exePath);
        } else {
            // It's a regular executable path
            const { spawn } = await import('child_process');
            const gameDir = path.dirname(exePath);

            console.log(`ℹ️ Spawning in dir: ${gameDir}`);

            try {
                const gameProcess = spawn(exePath, [], {
                    detached: true,
                    stdio: 'ignore',
                    cwd: gameDir
                });

                gameProcess.on('error', (err) => {
                    console.error('Spawn error:', err);
                    // Fallback if spawn fails immediately (e.g. EACCES)
                    console.log('⚠️ Spawn failed, attempting shell.openPath...');
                    shell.openPath(exePath);
                });

                gameProcess.unref();
                return { success: true };

            } catch (spawnError) {
                console.error('Spawn exception:', spawnError);
                console.log('⚠️ Spawn exception, attempting shell.openPath...');
                await shell.openPath(exePath);
                return { success: true };
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Launch error:', error);
        try {
            await shell.openPath(exePath);
            return { success: true };
        } catch (e) {
            return { success: false, error: error.message };
        }
    }
});

ipcMain.handle('open-launcher', async (event, launcher) => {
    const launchers = {
        steam: 'steam://open/main',
        epic: 'com.epicgames.launcher://store',
        rockstar: 'rockstar://',
        riot: 'riotclient://',
        ea: 'origin://',
        ubisoft: 'uplay://launch',
        xbox: 'ms-windows-store://navigated-from-xbox' // Opens Xbox app
    };

    try {
        await shell.openExternal(launchers[launcher] || launcher);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.handle('window-close', () => mainWindow.close());

// --- Auto Updater Logic ---
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const setupUpdater = (win) => {
    autoUpdater.on('checking-for-update', () => {
        console.log('🔄 Checking for update...');
        win.webContents.send('update-log', 'Buscando actualizaciones...');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('✨ Update available:', info.version);
        win.webContents.send('update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('✅ Update not available.');
        win.webContents.send('update-log', 'Ya tienes la última versión.');
    });

    autoUpdater.on('error', (err) => {
        console.error('❌ Error in auto-updater:', err);
        win.webContents.send('update-error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const logMsg = `Descargando: ${Math.round(progressObj.percent)}% (${(progressObj.bytesPerSecond / 1024).toFixed(2)} KB/s)`;
        console.log(logMsg);
        win.webContents.send('download-progress', progressObj.percent);
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('✅ Update downloaded');
        win.webContents.send('update-downloaded', info);
    });
};

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
});

// Replace old update check with autoUpdater
ipcMain.handle('check-for-updates', async () => {
    if (app.isPackaged) {
        return autoUpdater.checkForUpdates();
    } else {
        console.log('⚠️ Skipping update check in dev mode');
        return null;
    }
});

// Helper for opening external URLs
ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});
