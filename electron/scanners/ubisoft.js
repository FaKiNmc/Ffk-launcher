import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function getAllDrives() {
    try {
        const { stdout } = await execAsync('wmic logicaldisk get name', { encoding: 'utf-8' });
        const drives = stdout.split('\n')
            .map(line => line.trim())
            .filter(line => /^[A-Z]:$/.test(line));
        return drives;
    } catch {
        return ['C:', 'D:', 'E:', 'F:', 'B:'];
    }
}

export async function scanUbisoftGames() {
    const games = [];
    const foundGames = new Set();

    console.log('Ubisoft: Starting automatic game detection...');

    // Method 1: Scan Ubisoft Connect installation folder
    await scanUbisoftConnect(games, foundGames);

    // Method 2: Scan Windows Registry for Ubisoft games
    await scanUbisoftRegistry(games, foundGames);

    // Method 3: Scan common folders across all drives
    await scanCommonFolders(games, foundGames);

    console.log(`Found ${games.length} Ubisoft games`);
    return games;
}

// Method 1: Scan Ubisoft Connect default installation folder
async function scanUbisoftConnect(games, foundGames) {
    const programFiles = [
        process.env['PROGRAMFILES'] || 'C:\\Program Files',
        process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'
    ];

    const ubisoftPaths = [
        ...programFiles.map(pf => path.join(pf, 'Ubisoft', 'Ubisoft Game Launcher', 'games')),
        ...programFiles.map(pf => path.join(pf, 'Ubisoft Game Launcher', 'games'))
    ];

    for (const basePath of ubisoftPaths) {
        if (!fs.existsSync(basePath)) continue;

        console.log(`Ubisoft: Scanning ${basePath}`);

        try {
            const gameFolders = fs.readdirSync(basePath).filter(f => {
                try {
                    return fs.statSync(path.join(basePath, f)).isDirectory();
                } catch { return false; }
            });

            for (const folder of gameFolders) {
                const gamePath = path.join(basePath, folder);
                const gameName = cleanGameName(folder);

                if (foundGames.has(gameName)) continue;
                if (isSteamGame(gamePath)) continue;

                const exePath = findMainExecutable(gamePath, 0, 4);

                if (exePath) {
                    foundGames.add(gameName);
                    games.push({
                        id: `ubisoft_${gameName.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                        name: gameName,
                        platform: 'ubisoft',
                        installDir: gamePath,
                        exePath: exePath,
                        coverUrl: null
                    });
                    console.log(`Found Ubisoft (connect): ${gameName}`);
                }
            }
        } catch (err) {
            console.log(`Error scanning ${basePath}: ${err.message}`);
        }
    }
}

// Method 2: Check Windows Registry for Ubisoft games
async function scanUbisoftRegistry(games, foundGames) {
    const registryPaths = [
        'HKLM\\SOFTWARE\\Ubisoft\\Launcher\\Installs',
        'HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs',
        'HKLM\\SOFTWARE\\Ubisoft',
        'HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft'
    ];

    for (const regPath of registryPaths) {
        try {
            const { stdout } = await execAsync(`reg query "${regPath}" /s 2>nul`, { encoding: 'utf-8' });

            const lines = stdout.split('\n');
            let currentGame = null;
            let installDir = null;

            for (const line of lines) {
                if (line.startsWith('HKEY')) {
                    if (currentGame && installDir && !foundGames.has(currentGame) && isValidGameName(currentGame)) {
                        if (fs.existsSync(installDir) && !isSteamGame(installDir)) {
                            const exePath = findMainExecutable(installDir, 0, 4);
                            if (exePath) {
                                foundGames.add(currentGame);
                                games.push({
                                    id: `ubisoft_${currentGame.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                                    name: currentGame,
                                    platform: 'ubisoft',
                                    installDir: installDir,
                                    exePath: exePath,
                                    coverUrl: null
                                });
                                console.log(`Found Ubisoft (registry): ${currentGame}`);
                            }
                        }
                    }

                    const pathParts = line.split('\\');
                    currentGame = cleanGameName(pathParts[pathParts.length - 1].trim());
                    installDir = null;
                }

                // Look for InstallDir value
                const installMatch = line.match(/InstallDir\s+REG_SZ\s+(.+)/i);
                if (installMatch) {
                    installDir = installMatch[1].trim();
                }
            }

            // Handle last game
            if (currentGame && installDir && !foundGames.has(currentGame) && isValidGameName(currentGame)) {
                if (fs.existsSync(installDir) && !isSteamGame(installDir)) {
                    const exePath = findMainExecutable(installDir, 0, 4);
                    if (exePath) {
                        foundGames.add(currentGame);
                        games.push({
                            id: `ubisoft_${currentGame.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                            name: currentGame,
                            platform: 'ubisoft',
                            installDir: installDir,
                            exePath: exePath,
                            coverUrl: null
                        });
                        console.log(`Found Ubisoft (registry): ${currentGame}`);
                    }
                }
            }
        } catch { }
    }
}

// Method 3: Scan common game folders on all drives
async function scanCommonFolders(games, foundGames) {
    const drives = await getAllDrives();

    const searchFolders = [
        'Juegos',
        'Games',
        'Ubisoft Games',
        'Ubisoft',
        'Program Files\\Ubisoft',
        'Program Files (x86)\\Ubisoft',
        'Program Files\\Ubisoft\\Ubisoft Game Launcher\\games',
        'Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games'
    ];

    const searchPaths = drives.flatMap(drive =>
        searchFolders.map(folder => path.join(drive, folder))
    );

    for (const basePath of searchPaths) {
        if (!fs.existsSync(basePath)) continue;

        try {
            const gameFolders = fs.readdirSync(basePath).filter(f => {
                try {
                    return fs.statSync(path.join(basePath, f)).isDirectory();
                } catch { return false; }
            });

            for (const folder of gameFolders) {
                const gamePath = path.join(basePath, folder);

                if (!isLikelyUbisoftGame(folder)) continue;
                if (isSteamGame(gamePath)) continue;

                const gameName = cleanGameName(folder);

                if (foundGames.has(gameName)) continue;

                const exePath = findMainExecutable(gamePath, 0, 4);

                if (exePath) {
                    foundGames.add(gameName);
                    games.push({
                        id: `ubisoft_${gameName.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                        name: gameName,
                        platform: 'ubisoft',
                        installDir: gamePath,
                        exePath: exePath,
                        coverUrl: null
                    });
                    console.log(`Found Ubisoft (folder): ${gameName}`);
                }
            }
        } catch (err) {
            console.log(`Error scanning ${basePath}: ${err.message}`);
        }
    }
}

// Check if folder name suggests it's a Ubisoft game
function isLikelyUbisoftGame(folderName) {
    const ubisoftGameKeywords = [
        'assassin', 'creed', 'far cry', 'farcry', 'watch dogs', 'watchdogs',
        'rainbow six', 'r6', 'siege', 'division', 'ghost recon',
        'splinter cell', 'rayman', 'prince of persia', 'beyond good',
        'anno', 'settlers', 'crew', 'steep', 'for honor', 'skull and bones',
        'immortals', 'fenyx', 'avatar', 'riders republic', 'xdefiant',
        'just dance', 'trials', 'trackmania', 'scott pilgrim', 'south park',
        'mario rabbids', 'rabbids', 'child of light', 'valiant hearts'
    ];

    const lowerName = folderName.toLowerCase();
    return ubisoftGameKeywords.some(keyword => lowerName.includes(keyword));
}

// Check if game folder is a Steam game (definitive indicators only)
function isSteamGame(gamePath) {
    const definiteSteamIndicators = [
        'steam_appid.txt',
        'installscript.vdf',
        'steam_emu.ini'
    ];

    try {
        if (gamePath.toLowerCase().includes('steamapps')) {
            return true;
        }

        const files = fs.readdirSync(gamePath);
        for (const file of files) {
            if (definiteSteamIndicators.includes(file.toLowerCase())) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
}

// Find main executable with configurable depth
function findMainExecutable(dir, currentDepth = 0, maxDepth = 4) {
    if (currentDepth > maxDepth || !fs.existsSync(dir)) return null;

    try {
        const files = fs.readdirSync(dir);
        let candidates = [];

        for (const file of files) {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    if (!isExcludedFolder(file)) {
                        const res = findMainExecutable(filePath, currentDepth + 1, maxDepth);
                        if (res) candidates.push(res);
                    }
                } else if (file.toLowerCase().endsWith('.exe') && !isExcludedExe(file)) {
                    candidates.push({ path: filePath, size: stat.size });
                }
            } catch { }
        }

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => {
            if (typeof a === 'string') return 1;
            if (typeof b === 'string') return -1;
            return (b.size || 0) - (a.size || 0);
        });

        const result = candidates[0];
        return typeof result === 'string' ? result : result.path;
    } catch {
        return null;
    }
}

function isExcludedFolder(folderName) {
    const excluded = [
        '__installer', '_commonredist', 'redist', 'directx',
        'vcredist', 'support', 'logs', 'crash', 'temp'
    ];
    return excluded.some(ex => folderName.toLowerCase().includes(ex));
}

function isExcludedExe(filename) {
    const excluded = [
        'uninstall', 'cleanup', 'touchup', 'crash', 'unity',
        'dxsetup', 'vcredist', 'helper', 'update', 'redist',
        'setup', 'installer', 'launcher', 'anticheat', 'eac'
    ];
    const name = filename.toLowerCase();
    return excluded.some(ex => name.includes(ex));
}

// Check if the game name is valid (not a numeric ID or system entry)
function isValidGameName(name) {
    if (!name || name.length === 0) return false;

    // Filter out pure numbers (registry IDs like 635, 11903)
    if (/^\d+$/.test(name)) return false;

    // Filter out system/launcher entries
    const invalidNames = [
        'launcher', 'installs', 'ubisoft', 'uplay',
        'overlay', 'connect', 'settings', 'cache'
    ];
    const lowerName = name.toLowerCase();
    if (invalidNames.includes(lowerName)) return false;

    // Must be at least 3 characters
    if (name.length < 3) return false;

    return true;
}

function cleanGameName(folderName) {
    return folderName
        .replace(/_/g, ' ')
        .replace(/\./g, ' ')
        .replace(/\(TM\)/gi, '')
        .replace(/™/g, '')
        .replace(/®/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

