import fs from 'fs';
import path from 'path';

export async function scanEpicGames() {
    const games = [];

    try {
        const manifestsPath = path.join(
            process.env.ProgramData || 'C:\\ProgramData',
            'Epic',
            'EpicGamesLauncher',
            'Data',
            'Manifests'
        );

        if (!fs.existsSync(manifestsPath)) {
            console.log('Epic manifests folder not found');
            return games;
        }

        const manifestFiles = fs.readdirSync(manifestsPath).filter(f => f.endsWith('.item'));

        for (const file of manifestFiles) {
            try {
                const content = fs.readFileSync(path.join(manifestsPath, file), 'utf-8');
                const manifest = JSON.parse(content);

                if (manifest.DisplayName && manifest.InstallLocation && manifest.LaunchExecutable) {
                    const exePath = path.join(manifest.InstallLocation, manifest.LaunchExecutable);

                    if (fs.existsSync(exePath)) {
                        games.push({
                            id: `epic_${manifest.AppName || manifest.CatalogItemId}`,
                            name: manifest.DisplayName,
                            platform: 'epic',
                            appId: manifest.AppName || manifest.CatalogItemId,
                            installDir: manifest.InstallLocation,
                            exePath: exePath,
                            coverUrl: null
                        });
                        console.log(`Found Epic: ${manifest.DisplayName}`);
                    }
                }
            } catch (e) {
                console.error('Error parsing Epic manifest:', e.message);
            }
        }
    } catch (error) {
        console.error('Epic scan error:', error);
    }

    return games;
}
