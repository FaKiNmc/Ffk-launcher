import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getAllDrives() {
    try {
        const { stdout } = await execAsync('wmic logicaldisk get name', { encoding: 'utf-8' });
        const drives = stdout.split('\n')
            .map(line => line.trim())
            .filter(line => /^[A-Z]:$/.test(line));
        return drives;
    } catch {
        return ['C:', 'D:', 'E:', 'F:'];
    }
}

// Find Riot Client Services executable - searches many common locations
async function findRiotClientServices() {
    const drives = await getAllDrives();

    // All possible folder prefixes where Riot might be installed
    const folderPrefixes = [
        '',                      // Root: D:\Riot Games
        'Program Files',         // D:\Program Files\Riot Games
        'Program Files (x86)',   // D:\Program Files (x86)\Riot Games
        'juegos',                // D:\juegos\Riot Games (Spanish)
        'Juegos',                // D:\Juegos\Riot Games
        'Games',                 // D:\Games\Riot Games
        'games',                 // D:\games\Riot Games
    ];

    const possiblePaths = [];

    for (const drive of drives) {
        for (const prefix of folderPrefixes) {
            const basePath = prefix
                ? path.join(drive, prefix, 'Riot Games', 'Riot Client', 'RiotClientServices.exe')
                : path.join(drive, 'Riot Games', 'Riot Client', 'RiotClientServices.exe');
            possiblePaths.push(basePath);
        }
    }

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                console.log('✅ Found RiotClientServices at:', p);
                return p;
            }
        } catch (err) {
            // Silently skip inaccessible paths
        }
    }

    console.warn('⚠️ RiotClientServices.exe not found in any standard location');
    return null;
}

export async function scanRiotGames() {
    const games = [];
    const foundGames = new Set();

    // Find Riot Client Services for launching games
    const riotClientPath = await findRiotClientServices();
    console.log('Riot Client Services:', riotClientPath || 'Not found');

    // Riot games info with product IDs for RiotClientServices
    const riotGamesInfo = {
        'league_of_legends': {
            name: 'League of Legends',
            folder: 'League of Legends',
            exe: 'LeagueClient.exe',
            productId: 'league_of_legends'
        },
        'valorant': {
            name: 'VALORANT',
            folder: 'VALORANT',
            exe: 'VALORANT.exe',
            productId: 'valorant'
        },
        'lor': {
            name: 'Legends of Runeterra',
            folder: 'LoR',
            exe: 'LoR.exe',
            productId: 'bacon'
        }
    };

    // First try the official Riot installs file
    const riotInstallsPath = path.join(
        process.env.ProgramData || 'C:\\ProgramData',
        'Riot Games',
        'RiotClientInstalls.json'
    );

    if (fs.existsSync(riotInstallsPath)) {
        try {
            const installsContent = fs.readFileSync(riotInstallsPath, 'utf-8');
            const installs = JSON.parse(installsContent);

            if (installs.associated_client) {
                for (const [gamePath] of Object.entries(installs.associated_client)) {
                    const normalizedPath = gamePath.replace(/\//g, '\\');

                    for (const [key, info] of Object.entries(riotGamesInfo)) {
                        if (normalizedPath.toLowerCase().includes(info.folder.toLowerCase())) {
                            const exeFullPath = path.join(normalizedPath, info.exe);

                            if (fs.existsSync(exeFullPath) && !foundGames.has(key)) {
                                foundGames.add(key);

                                // Build launch command - will use shell.openExternal if RiotClient found
                                let launchPath;
                                let useShell = false;

                                if (riotClientPath) {
                                    // Use RiotClientServices with arguments
                                    launchPath = `"${riotClientPath}" --launch-product=${info.productId} --launch-patchline=live`;
                                    useShell = true;
                                } else {
                                    // No RiotClient found - will show error
                                    launchPath = exeFullPath;
                                }

                                games.push({
                                    id: `riot_${key}`,
                                    name: info.name,
                                    platform: 'riot',
                                    installDir: normalizedPath,
                                    exePath: launchPath,
                                    isCommand: true,
                                    useShellLaunch: useShell, // Flag to use shell.openExternal
                                    requiresRiotClient: !riotClientPath,
                                    coverUrl: null
                                });
                                console.log(`Found Riot: ${info.name} (Shell: ${useShell})`);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing Riot installs:', e);
        }
    }

    // Also search all drives for Riot Games folders in various locations
    const drives = await getAllDrives();
    const searchFolders = [
        'Riot Games',
        'Games\\Riot Games',
        'games\\Riot Games',
        'Juegos\\Riot Games',
        'juegos\\Riot Games',
        'Program Files\\Riot Games',
        'Program Files (x86)\\Riot Games'
    ];

    for (const drive of drives) {
        for (const folder of searchFolders) {
            const riotPath = path.join(drive, folder);
            if (!fs.existsSync(riotPath)) continue;

            for (const [key, info] of Object.entries(riotGamesInfo)) {
                if (foundGames.has(key)) continue;

                const gamePath = path.join(riotPath, info.folder);
                const exeFullPath = path.join(gamePath, info.exe);

                if (fs.existsSync(exeFullPath)) {
                    foundGames.add(key);

                    // Build launch command
                    let launchPath;
                    let useShell = false;

                    if (riotClientPath) {
                        launchPath = `"${riotClientPath}" --launch-product=${info.productId} --launch-patchline=live`;
                        useShell = true;
                    } else {
                        launchPath = exeFullPath;
                    }

                    games.push({
                        id: `riot_${key}`,
                        name: info.name,
                        platform: 'riot',
                        installDir: gamePath,
                        exePath: launchPath,
                        isCommand: true,
                        useShellLaunch: useShell,
                        requiresRiotClient: !riotClientPath,
                        coverUrl: null
                    });
                    console.log(`Found Riot: ${info.name} (Shell: ${useShell})`);
                }
            }
        }
    }

    console.log(`Found ${games.length} Riot games`);
    return games;
}
