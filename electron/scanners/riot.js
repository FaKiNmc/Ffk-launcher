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

// Find Riot Client Services executable
async function findRiotClientServices() {
    const drives = await getAllDrives();
    const possiblePaths = [
        ...drives.map(d => path.join(d, 'Riot Games', 'Riot Client', 'RiotClientServices.exe')),
        ...drives.map(d => path.join(d, 'Program Files', 'Riot Games', 'Riot Client', 'RiotClientServices.exe')),
        ...drives.map(d => path.join(d, 'Program Files (x86)', 'Riot Games', 'Riot Client', 'RiotClientServices.exe'))
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
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

                                // Build launch command using RiotClientServices
                                let launchPath;
                                if (riotClientPath) {
                                    // Use RiotClientServices with --launch-product argument
                                    launchPath = `"${riotClientPath}" --launch-product=${info.productId} --launch-patchline=live`;
                                } else {
                                    // Fallback to direct exe
                                    launchPath = exeFullPath;
                                }

                                games.push({
                                    id: `riot_${key}`,
                                    name: info.name,
                                    platform: 'riot',
                                    installDir: normalizedPath,
                                    exePath: launchPath,
                                    isCommand: !!riotClientPath, // Flag to indicate this is a command, not a path
                                    coverUrl: null
                                });
                                console.log(`Found Riot: ${info.name}`);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing Riot installs:', e);
        }
    }

    // Also search all drives for Riot Games folders
    const drives = await getAllDrives();
    const searchFolders = ['Riot Games', 'Games\\Riot Games', 'Program Files\\Riot Games', 'Juegos\\Riot Games'];

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

                    let launchPath;
                    if (riotClientPath) {
                        launchPath = `"${riotClientPath}" --launch-product=${info.productId} --launch-patchline=live`;
                    } else {
                        launchPath = exeFullPath;
                    }

                    games.push({
                        id: `riot_${key}`,
                        name: info.name,
                        platform: 'riot',
                        installDir: gamePath,
                        exePath: launchPath,
                        isCommand: !!riotClientPath,
                        coverUrl: null
                    });
                    console.log(`Found Riot: ${info.name}`);
                }
            }
        }
    }

    console.log(`Found ${games.length} Riot games`);
    return games;
}
