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

export async function scanEAGames() {
    const games = [];
    const foundGames = new Set();

    console.log('EA: Starting automatic game detection...');

    // Method 1: Scan common folders across all drives (most reliable)
    await scanCommonFolders(games, foundGames);

    // Method 2: Scan Windows Registry for EA games
    await scanEARegistry(games, foundGames);

    console.log(`Found ${games.length} EA games`);
    return games;
}

// Method 1: Scan common game folders on all drives
async function scanCommonFolders(games, foundGames) {
    const drives = await getAllDrives();

    // Common game installation folder names
    // IMPORTANT: DO NOT include Steam folders - games there are Steam games!
    const searchFolders = [
        'Juegos',
        'Games',
        'EA Games',
        'Electronic Arts',
        'Origin Games',
        'Program Files\\EA Games',
        'Program Files (x86)\\EA Games',
        'Program Files\\Electronic Arts',
        'Program Files (x86)\\Electronic Arts',
        'Program Files\\Origin Games',
        'Program Files (x86)\\Origin Games'
        // Removed Steam folders to avoid duplicates
    ];

    // Build all search paths
    const searchPaths = drives.flatMap(drive =>
        searchFolders.map(folder => path.join(drive, folder))
    );

    console.log('EA: Scanning folders:', searchPaths.filter(p => fs.existsSync(p)).join(', '));

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

                // Check if this looks like an EA game
                if (!isLikelyEAGame(folder)) continue;

                // IMPORTANT: Skip if it's a Steam game
                if (isSteamGame(gamePath)) {
                    console.log(`EA: Skipping ${folder} - detected as Steam game`);
                    continue;
                }

                const gameName = cleanGameName(folder);

                if (foundGames.has(gameName)) continue;

                // Find main executable with increased depth
                const exePath = findMainExecutable(gamePath, 0, 4);

                if (exePath) {
                    foundGames.add(gameName);
                    games.push({
                        id: `ea_${gameName.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                        name: gameName,
                        platform: 'ea',
                        installDir: gamePath,
                        exePath: exePath,
                        coverUrl: null
                    });
                    console.log(`Found EA (folder): ${gameName} at ${exePath}`);
                }
            }
        } catch (err) {
            console.log(`Error scanning ${basePath}: ${err.message}`);
        }
    }
}

// Check if a game folder is a Steam game by looking for DEFINITIVE Steam-specific files
// Note: steam_api.dll alone is NOT definitive - many games use it as a dependency
function isSteamGame(gamePath) {
    // Only these are definitive Steam indicators
    const definiteSteamIndicators = [
        'steam_appid.txt',      // Contains Steam App ID - very definitive
        'installscript.vdf',    // Steam installation script
        'steam_emu.ini'         // Steam emulator config
    ];

    try {
        // Check if path contains 'steamapps' - definitive Steam location
        if (gamePath.toLowerCase().includes('steamapps')) {
            return true;
        }

        const files = fs.readdirSync(gamePath);
        // Check root folder for definitive Steam files only
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

// Check if folder name suggests it's an EA game
function isLikelyEAGame(folderName) {
    const eaGameKeywords = [
        'battlefield', 'bf6', 'bf5', 'bf4', 'bf3', 'bf2', 'bf1',
        'fifa', 'fc 24', 'fc 25', 'fc 26', 'ea sports fc',
        'apex', 'need for speed', 'nfs',
        'mass effect', 'dragon age', 'dead space',
        'star wars', 'jedi',  // EA Star Wars games (exclusion by Steam files, not keywords)
        'sims', 'command conquer', 'plants vs zombies',
        'it takes two', 'a way out', 'titanfall', 'crysis',
        'burnout', 'skate', 'medal of honor', 'mirrors edge',
        'anthem', 'wild hearts', 'garden warfare'
    ];

    const lowerName = folderName.toLowerCase();

    // Explicit exclusions
    if (lowerName === 'ea core' || lowerName.includes('ea core')) return false;

    return eaGameKeywords.some(keyword => lowerName.includes(keyword));
}

// Method 2: Check Windows Registry for EA games
async function scanEARegistry(games, foundGames) {
    const registryPaths = [
        'HKLM\\SOFTWARE\\EA Games',
        'HKLM\\SOFTWARE\\WOW6432Node\\EA Games',
        'HKLM\\SOFTWARE\\Electronic Arts',
        'HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts'
    ];

    for (const regPath of registryPaths) {
        try {
            const { stdout } = await execAsync(`reg query "${regPath}" /s 2>nul`, { encoding: 'utf-8' });

            const lines = stdout.split('\n');
            let currentGame = null;
            let installDir = null;

            for (const line of lines) {
                if (line.startsWith('HKEY')) {
                    if (currentGame && installDir && !foundGames.has(currentGame)) {
                        // EXCLUSION: Skip EA Core and other system components
                        if (currentGame.toLowerCase() === 'ea core' || currentGame.toLowerCase().includes('ea core')) {
                            console.log(`EA Registry: Skipping excluded component: ${currentGame}`);
                        } else if (fs.existsSync(installDir) && !isSteamGame(installDir)) {
                            const exePath = findMainExecutable(installDir, 0, 4);
                            if (exePath) {
                                foundGames.add(currentGame);
                                games.push({
                                    id: `ea_${currentGame.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                                    name: currentGame,
                                    platform: 'ea',
                                    installDir: installDir,
                                    exePath: exePath,
                                    coverUrl: null
                                });
                                console.log(`Found EA (registry): ${currentGame}`);
                            }
                        }
                    }

                    const pathParts = line.split('\\');
                    currentGame = cleanGameName(pathParts[pathParts.length - 1].trim());
                    installDir = null;
                }

                const installMatch = line.match(/Install\s*Dir\s+REG_SZ\s+(.+)/i);
                if (installMatch) {
                    installDir = installMatch[1].trim();
                }
            }

            // Handle last game
            if (currentGame && installDir && !foundGames.has(currentGame)) {
                if (fs.existsSync(installDir) && !isSteamGame(installDir)) {
                    const exePath = findMainExecutable(installDir, 0, 4);
                    if (exePath) {
                        foundGames.add(currentGame);
                        games.push({
                            id: `ea_${currentGame.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
                            name: currentGame,
                            platform: 'ea',
                            installDir: installDir,
                            exePath: exePath,
                            coverUrl: null
                        });
                        console.log(`Found EA (registry): ${currentGame}`);
                    }
                }
            }
        } catch { }
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
                    // Don't recurse into known non-game folders
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

        // Sort by size (largest exe is usually the game)
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
        'setup', 'installer', 'launcher', 'anticheat', 'eaanticheat'
    ];
    const name = filename.toLowerCase();
    return excluded.some(ex => name.includes(ex));
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
