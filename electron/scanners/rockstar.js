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
        return ['C:', 'D:', 'E:', 'F:'];
    }
}

export async function scanRockstarGames() {
    const games = [];
    const foundGames = new Set();

    // Known games with all possible folder names and executables
    const knownGames = [
        {
            name: 'Grand Theft Auto V',
            folders: [
                'Grand Theft Auto V',
                'Grand Theft Auto V Enhanced',
                'GTAV',
                'GTA5',
                'GTA V',
                'GTA V Enhanced'
            ],
            exes: [
                'GTA5_Enhanced.exe',
                'GTA5_Enhanced_BE.exe',
                'PlayGTAV.exe',
                'GTA5.exe',
                'GTAV.exe',
                'GTAVLauncher.exe'
            ]
        },
        {
            name: 'Red Dead Redemption 2',
            folders: ['Red Dead Redemption 2', 'RDR2', 'Red Dead 2'],
            exes: ['RDR2.exe', 'PlayRDR2.exe', 'RedDeadRedemption2.exe']
        },
        {
            name: 'Grand Theft Auto IV',
            folders: ['Grand Theft Auto IV', 'GTAIV', 'GTA4', 'GTA IV'],
            exes: ['GTAIV.exe', 'LaunchGTAIV.exe', 'GTA4.exe']
        },
        {
            name: 'Max Payne 3',
            folders: ['Max Payne 3', 'MaxPayne3'],
            exes: ['MaxPayne3.exe', 'Max Payne 3.exe']
        },
        {
            name: 'L.A. Noire',
            folders: ['L.A. Noire', 'LA Noire', 'LANoire'],
            exes: ['LANoire.exe', 'L.A. Noire.exe']
        }
    ];

    // Common game installation folders
    const drives = await getAllDrives();
    const searchFolders = [
        'Juegos',
        'Games',
        'Rockstar Games',
        'Program Files\\Rockstar Games',
        'Program Files (x86)\\Rockstar Games',
        'SteamLibrary\\steamapps\\common',
        'Program Files\\Steam\\steamapps\\common',
        'Program Files (x86)\\Steam\\steamapps\\common',
        'Epic Games',
        'Program Files\\Epic Games',
        'Programas',
        'Programas\\Rockstar Games'
    ];

    const searchPaths = drives.flatMap(drive =>
        searchFolders.map(folder => path.join(drive, folder))
    );

    console.log('Rockstar: Scanning common game folders...');

    for (const basePath of searchPaths) {
        if (!fs.existsSync(basePath)) continue;

        for (const game of knownGames) {
            if (foundGames.has(game.name)) continue;

            for (const folder of game.folders) {
                if (foundGames.has(game.name)) break;

                const gamePath = path.join(basePath, folder);

                if (!fs.existsSync(gamePath)) continue;

                for (const exe of game.exes) {
                    const exePath = path.join(gamePath, exe);

                    if (fs.existsSync(exePath)) {
                        foundGames.add(game.name);
                        games.push({
                            id: `rockstar_${game.name.replace(/\s/g, '_')}`,
                            name: game.name,
                            platform: 'rockstar',
                            installDir: gamePath,
                            exePath: exePath,
                            coverUrl: null
                        });
                        console.log(`Found Rockstar: ${game.name} at ${exePath}`);
                        break;
                    }
                }
            }
        }
    }

    console.log(`Found ${games.length} Rockstar games`);
    return games;
}
