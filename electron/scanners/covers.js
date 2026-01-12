// Cover fetching module - fetches game covers from multiple sources
// Runs asynchronously to not block the UI

import https from 'https';
import http from 'http';

// HTTP GET returning Buffer (for images)
function httpGetBuffer(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const options = {
            timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };
        const req = lib.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                httpGetBuffer(res.headers.location, timeout).then(resolve).catch(reject);
                return;
            }

            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(Buffer.concat(chunks));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Simple HTTP GET for JSON
function httpGetText(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const options = {
            timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };
        const req = lib.get(url, options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(Buffer.concat(chunks).toString());
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
    });
}

// Known cover URLs for popular games
// We will download these, so CORS doesn't matter as much, but reliable sources are better.
const KNOWN_COVERS = {
    'grand theft auto v': 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_600x900.jpg',
    'gta v': 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_600x900.jpg',
    // Wikimedia is very reliable for hotlinking/downloading
    'valorant': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg',
    'league of legends': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg',
    'red dead redemption 2': 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg',
    'fortnite': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Fortnite_F_letterance_logo.png',
    'counter-strike 2': 'https://cdn.akamai.steamstatic.com/steam/apps/730/library_600x900.jpg',
    // Fallback headers for problematic games that failed library image
    'jurassic world evolution 3': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2958130/library_600x900.jpg',
    'roadside research demo': 'https://cdn.akamai.steamstatic.com/steam/apps/3911640/header.jpg',

    // EA Games - using Steam CDN or RAWG specific
    'battlefield 6': 'https://media.rawg.io/media/games/dcc/dcc38d78ab1f1a90fdc4ba1bea3a73ff.jpg',
    'battlefield 2042': 'https://cdn.akamai.steamstatic.com/steam/apps/1517290/library_600x900.jpg',
    'ea sports fc 26': 'https://media.rawg.io/media/screenshots/70f/70fb740261ef152d0d3392a9a306c9ca.jpg',
    'ea sports fc 25': 'https://cdn.akamai.steamstatic.com/steam/apps/2669320/library_600x900.jpg',
    'ea sports fc 24': 'https://cdn.akamai.steamstatic.com/steam/apps/2195250/library_600x900.jpg',
    'apex legends': 'https://cdn.akamai.steamstatic.com/steam/apps/1172470/library_600x900.jpg',
    'the sims 4': 'https://cdn.akamai.steamstatic.com/steam/apps/1222670/library_600x900.jpg',
    'need for speed heat': 'https://cdn.akamai.steamstatic.com/steam/apps/1222680/library_600x900.jpg',

    // Ubisoft Games - using Steam CDN
    'ghost recon breakpoint': 'https://cdn.akamai.steamstatic.com/steam/apps/2231380/library_600x900.jpg',
    "tom clancy's ghost recon breakpoint": 'https://cdn.akamai.steamstatic.com/steam/apps/2231380/library_600x900.jpg',
    'rainbow six siege': 'https://cdn.akamai.steamstatic.com/steam/apps/359550/library_600x900.jpg',
    "tom clancy's rainbow six siege": 'https://cdn.akamai.steamstatic.com/steam/apps/359550/library_600x900.jpg',
    "tom clancy's rainbow six siege x": 'https://cdn.akamai.steamstatic.com/steam/apps/359550/library_600x900.jpg',
    'assassins creed valhalla': 'https://cdn.akamai.steamstatic.com/steam/apps/2208920/library_600x900.jpg',
    'assassins creed mirage': 'https://cdn.akamai.steamstatic.com/steam/apps/2060150/library_600x900.jpg',
    'far cry 6': 'https://cdn.akamai.steamstatic.com/steam/apps/2369390/library_600x900.jpg',
    'watch dogs legion': 'https://cdn.akamai.steamstatic.com/steam/apps/2289090/library_600x900.jpg',
    'the division 2': 'https://cdn.akamai.steamstatic.com/steam/apps/2221490/library_600x900.jpg',

    // Epic Games exclusives - using Epic CDN or alternatives
    'wildgate': 'https://cdn.akamai.steamstatic.com/steam/apps/3504780/library_600x900.jpg'
};

// Fetch cover from RAWG.io
async function fetchFromRawg(gameName) {
    try {
        const searchName = gameName.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
        const simpleUrl = `https://api.rawg.io/api/games?search=${encodeURIComponent(searchName)}&page_size=1`;

        const response = await httpGetText(simpleUrl, 8000);
        const data = JSON.parse(response);

        if (data.results && data.results.length > 0) {
            const game = data.results[0];
            if (game.background_image) {
                return game.background_image;
            }
        }
    } catch (e) {
        // console.log(`RAWG fetch failed for ${gameName}:`, e.message);
    }
    return null;
}

async function getUrlBuffer(url) {
    try {
        const buffer = await httpGetBuffer(url);
        return buffer;
    } catch (e) {
        console.log(`Failed to download image ${url}: ${e.message}`);
        return null;
    }
}

// Get cover Base64 for a game
export async function fetchGameCover(gameName, platform, appId = null) {
    const nameLower = gameName.toLowerCase();
    let imageUrl = null;

    // 1. Check known covers
    if (KNOWN_COVERS[nameLower]) {
        imageUrl = KNOWN_COVERS[nameLower];
    }

    // 2. Steam logic
    else if (platform === 'steam' && appId) {
        // Try library image first
        imageUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;
    }

    // 3. RAWG logic
    else {
        imageUrl = await fetchFromRawg(gameName);
    }

    // Download and convert to Base64
    let buffer = imageUrl ? await getUrlBuffer(imageUrl) : null;

    // Retry logic for Steam if first image failed
    if (!buffer && platform === 'steam' && appId) {
        // Try header
        imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
        buffer = await getUrlBuffer(imageUrl);
    }

    // EA fallback: if no cover found for EA games, use EA logo
    if (!buffer && platform === 'ea') {
        // Use a reliable EA logo as fallback
        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Electronic-Arts-Logo.svg';
        buffer = await getUrlBuffer(imageUrl);
    }

    // Ubisoft fallback: if no cover found for Ubisoft games, use Ubisoft logo
    if (!buffer && platform === 'ubisoft') {
        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/78/Ubisoft_logo.svg';
        buffer = await getUrlBuffer(imageUrl);
    }

    // Epic Games fallback: if no cover found for Epic games, use Epic logo
    if (!buffer && platform === 'epic') {
        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/31/Epic_Games_logo.svg';
        buffer = await getUrlBuffer(imageUrl);
    }

    if (buffer) {
        const base64 = buffer.toString('base64');
        const mimeType = imageUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
    }

    return null;
}

// Fetch covers for multiple games
export async function enrichGamesWithCovers(games) {
    console.log(`Fetching covers (Base64) for ${games.length} games...`);

    const results = await Promise.all(
        games.map(async (game) => {
            // If already has a data URL or valid http url that we trust works, skip
            if (game.coverUrl && game.coverUrl.startsWith('data:')) {
                return game;
            }

            // Only fetch if no cover or if we want to replace Steam URLs with Base64 to ensure they show
            // Let's be aggressive: Fetch for everything that isn't already a Data URI to solve all display issues.
            if (!game.coverUrl || game.coverUrl.startsWith('http')) {
                try {
                    const coverBase64 = await fetchGameCover(game.name, game.platform, game.appId);
                    if (coverBase64) {
                        console.log(`Generated Base64 cover for ${game.name}`);
                        return { ...game, coverUrl: coverBase64 };
                    }
                } catch (e) {
                    console.error(`Error processing cover for ${game.name}:`, e.message);
                }
            }

            return game;
        })
    );

    console.log('Cover processing complete');
    return results;
}
