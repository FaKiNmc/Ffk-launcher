import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function scanSteamGames() {
    const games = [];

    try {
        // Get Steam install path from registry
        const { stdout } = await execAsync(
            'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
            { encoding: 'utf-8' }
        );

        const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/);
        if (!match) return games;

        const steamPath = match[1].trim();
        const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');

        if (!fs.existsSync(libraryFoldersPath)) return games;

        const libraryContent = fs.readFileSync(libraryFoldersPath, 'utf-8');
        const libraryPaths = [path.join(steamPath, 'steamapps')];

        // Parse library folders VDF
        const pathMatches = libraryContent.matchAll(/"path"\s+"([^"]+)"/g);
        for (const m of pathMatches) {
            const libPath = path.join(m[1].replace(/\\\\/g, '\\'), 'steamapps');
            if (fs.existsSync(libPath) && !libraryPaths.includes(libPath)) {
                libraryPaths.push(libPath);
            }
        }

        // Scan each library for games
        for (const libPath of libraryPaths) {
            const commonPath = path.join(libPath, 'common');
            if (!fs.existsSync(commonPath)) continue;

            const acfFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.acf'));

            for (const acf of acfFiles) {
                try {
                    const acfContent = fs.readFileSync(path.join(libPath, acf), 'utf-8');
                    const appIdMatch = acfContent.match(/"appid"\s+"(\d+)"/);
                    const nameMatch = acfContent.match(/"name"\s+"([^"]+)"/);
                    const installDirMatch = acfContent.match(/"installdir"\s+"([^"]+)"/);

                    if (appIdMatch && nameMatch && installDirMatch) {
                        const appId = appIdMatch[1];
                        const name = nameMatch[1];
                        const installDir = path.join(commonPath, installDirMatch[1]);

                        if (fs.existsSync(installDir)) {
                            // Exclude Steamworks Common Redistributables and other tools
                            const excludedAppIds = ['228980', '1007']; // 228980 = Steamworks Common Redistributables
                            const excludedNames = ['Steamworks Common Redistributables', 'Steamworks Shared'];

                            if (!excludedAppIds.includes(appId) && !excludedNames.includes(name)) {
                                games.push({
                                    id: `steam_${appId}`,
                                    name,
                                    platform: 'steam',
                                    appId,
                                    installDir,
                                    exePath: `steam://rungameid/${appId}`,
                                    coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing ACF:', e);
                }
            }
        }
    } catch (error) {
        console.error('Steam scan error:', error);
    }

    return games;
}
