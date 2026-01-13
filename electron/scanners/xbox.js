import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get all drives on the system
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

// Check if a folder is an Xbox game by looking for telltale files
function isXboxGameFolder(gamePath) {
    const contentPath = path.join(gamePath, 'Content');

    // Xbox games have a Content subfolder
    if (!fs.existsSync(contentPath)) return false;

    // Look for Xbox-specific files
    const xboxIndicators = [
        path.join(contentPath, 'appxmanifest.xml'),
        path.join(contentPath, 'MicrosoftGame.Config'),
        path.join(gamePath, 'appxmanifest.xml'),
        path.join(gamePath, 'MicrosoftGame.Config')
    ];

    for (const indicator of xboxIndicators) {
        if (fs.existsSync(indicator)) {
            return true;
        }
    }

    // Also check for .xvs/.xvi/.xct files which are Xbox-specific
    try {
        const contentFiles = fs.readdirSync(contentPath);
        const hasXboxFiles = contentFiles.some(f =>
            f.endsWith('.xvs') || f.endsWith('.xvi') || f.endsWith('.xct') || f.endsWith('.smd')
        );
        if (hasXboxFiles) return true;
    } catch (e) {
        // Ignore read errors
    }

    return false;
}

// Find the main executable in an Xbox game folder
function findGameExecutable(gamePath) {
    const contentPath = path.join(gamePath, 'Content');

    try {
        const files = fs.readdirSync(contentPath);
        const exeFile = files.find(f => f.endsWith('.exe') && !f.toLowerCase().includes('helper'));
        if (exeFile) {
            return path.join(contentPath, exeFile);
        }
    } catch (e) {
        // Ignore
    }

    return null;
}

// Find a local cover/logo image in the Xbox game folder
function findLocalCover(gamePath) {
    const contentPath = path.join(gamePath, 'Content');

    // Possible cover image files in Xbox games
    const coverFiles = [
        'GraphicsLogo.png',
        'SmallLogo.png',
        'Logo.png',
        'icon.png',
        'cover.png',
        'poster.png'
    ];

    try {
        const files = fs.readdirSync(contentPath);
        for (const coverFile of coverFiles) {
            if (files.includes(coverFile)) {
                return path.join(contentPath, coverFile);
            }
        }
        // Also check for any large PNG that might be a logo
        const pngFiles = files.filter(f => f.endsWith('.png') && f.toLowerCase().includes('logo'));
        if (pngFiles.length > 0) {
            return path.join(contentPath, pngFiles[0]);
        }
    } catch (e) {
        // Ignore
    }

    return null;
}

// Scan for Xbox Game Pass / Microsoft Store games
export async function scanXboxGames() {
    const games = [];
    const foundGames = new Set();

    console.log('Xbox: Starting Game Pass scan...');

    const drives = await getAllDrives();

    // Common folder names where games might be installed
    const gameFolderNames = [
        'XboxGames',
        'Xbox Games',
        'Juegos',
        'juegos',
        'Games',
        'games',
        'Game Pass',
        'GamePass'
    ];

    for (const drive of drives) {
        // Check common game folder paths
        const pathsToCheck = [
            // Direct in drive root
            ...gameFolderNames.map(f => path.join(drive, f)),
            // Inside common parent folders
            ...gameFolderNames.flatMap(f => [
                path.join(drive, 'Program Files', f),
                path.join(drive, 'Programas', f)
            ])
        ];

        for (const basePath of pathsToCheck) {
            if (!fs.existsSync(basePath)) continue;

            console.log(`Xbox: Scanning ${basePath}...`);

            try {
                const folders = fs.readdirSync(basePath);

                for (const folder of folders) {
                    const gamePath = path.join(basePath, folder);

                    try {
                        const stat = fs.statSync(gamePath);
                        if (!stat.isDirectory()) continue;

                        // Check if this is an Xbox game
                        if (isXboxGameFolder(gamePath) && !foundGames.has(folder.toLowerCase())) {
                            foundGames.add(folder.toLowerCase());

                            // Clean up folder name for display
                            const displayName = folder
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/[_-]/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();

                            const exePath = findGameExecutable(gamePath);
                            const localCover = findLocalCover(gamePath);

                            games.push({
                                id: `xbox_${folder.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                                name: displayName,
                                platform: 'xbox',
                                installDir: gamePath,
                                exePath: exePath || gamePath,
                                isXboxGame: true,
                                localCover: localCover, // Path to local logo if found
                                coverUrl: null
                            });

                            console.log(`Xbox: Found game: ${displayName} at ${gamePath}`);
                        }
                    } catch (e) {
                        // Skip folders we can't access
                    }
                }
            } catch (e) {
                console.error(`Xbox: Error scanning ${basePath}:`, e.message);
            }
        }
    }

    console.log(`Xbox: Found ${games.length} games total`);
    return games;
}
