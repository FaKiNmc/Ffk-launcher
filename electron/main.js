import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanAllGames } from './scanners/index.js';
import { enrichGamesWithCovers } from './scanners/covers.js';

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
// Play Stats Storage
const playStatsPath = path.join(app.getPath('userData'), 'play-stats.json');

function loadPlayStats() {
    try {
        if (fs.existsSync(playStatsPath)) {
            return JSON.parse(fs.readFileSync(playStatsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading play stats:', e);
    }
    return {};
}

function savePlayStats(stats) {
    try {
        fs.writeFileSync(playStatsPath, JSON.stringify(stats, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving play stats:', e);
        return false;
    }
}

// IPC Handlers
ipcMain.handle('scan-games', async () => {
    const results = await scanAllGames();
    results.custom = loadCustomGames(); // Load persisted custom games

    // Attach play time stats
    const stats = loadPlayStats();

    // Helper to merge stats
    const attachStats = (gameList) => {
        return gameList.map(game => ({
            ...game,
            playTime: stats[game.id] || 0
        }));
    };

    results.steam = attachStats(results.steam);
    results.epic = attachStats(results.epic);
    results.rockstar = attachStats(results.rockstar);
    results.riot = attachStats(results.riot);
    results.ea = attachStats(results.ea);
    results.ubisoft = attachStats(results.ubisoft);
    results.custom = attachStats(results.custom);

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

ipcMain.handle('launch-game', async (event, exePath, isCommand, gameId) => {
    // 1. Log to console for debugging
    console.log(`🔵 Launching: ${exePath} (ID: ${gameId})`);

    try {
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
            // It's a regular executable path - Track Duration if ID is present
            const { spawn } = await import('child_process');
            const startTime = Date.now();
            const gameDir = path.dirname(exePath);

            console.log(`ℹ️ Spawning in dir: ${gameDir}`);

            const gameProcess = spawn(exePath, [], {
                detached: true,
                stdio: 'ignore',
                cwd: gameDir
            });

            gameProcess.on('close', (code) => {
                if (gameId) {
                    const endTime = Date.now();
                    const durationInMs = endTime - startTime;
                    const durationMinutes = Math.floor(durationInMs / 60000);

                    console.log(`🎮 Game "${gameId}" finished.`);
                    console.log(`⏱️ Duration: ${durationInMs}ms (~${durationMinutes} min)`);

                    if (durationMinutes > 0) {
                        console.log(`💾 Saving stats for ${gameId}...`);
                        const stats = loadPlayStats();
                        const currentMinutes = stats[gameId] || 0;
                        stats[gameId] = currentMinutes + durationMinutes;
                        savePlayStats(stats);
                        console.log(`✅ New total playtime: ${stats[gameId]} min`);
                    } else {
                        console.log('⚠️ Playtime < 1 minute, not saved.');
                    }
                } else {
                    console.warn('⚠️ No Game ID provided, cannot track playtime.');
                }
            });

            gameProcess.unref();
            return { success: true };
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
        ubisoft: 'uplay://launch'  // Ubisoft Connect uses uplay:// protocol
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
