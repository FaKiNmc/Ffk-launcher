import { scanSteamGames } from './steam.js';
import { scanEpicGames } from './epic.js';
import { scanRockstarGames } from './rockstar.js';
import { scanRiotGames } from './riot.js';
import { scanEAGames } from './ea.js';
import { scanUbisoftGames } from './ubisoft.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const CUSTOM_GAMES_FILE = path.join(app.getPath('userData'), 'custom-games.json');

export async function scanAllGames() {
    console.log('Starting game scan...');

    const results = {
        steam: [],
        epic: [],
        rockstar: [],
        riot: [],
        ea: [],
        ubisoft: [],
        custom: []
    };

    try {
        console.log('Scanning Steam...');
        results.steam = await scanSteamGames();
        console.log(`Found ${results.steam.length} Steam games`);
    } catch (e) {
        console.error('Steam scan error:', e);
    }

    try {
        console.log('Scanning Epic...');
        results.epic = await scanEpicGames();
        console.log(`Found ${results.epic.length} Epic games`);
    } catch (e) {
        console.error('Epic scan error:', e);
    }

    try {
        console.log('Scanning Rockstar...');
        results.rockstar = await scanRockstarGames();
        console.log(`Found ${results.rockstar.length} Rockstar games`);
    } catch (e) {
        console.error('Rockstar scan error:', e);
    }

    try {
        console.log('Scanning Riot...');
        results.riot = await scanRiotGames();
        console.log(`Found ${results.riot.length} Riot games`);
    } catch (e) {
        console.error('Riot scan error:', e);
    }

    try {
        console.log('Scanning EA...');
        results.ea = await scanEAGames();
        console.log(`Found ${results.ea.length} EA games`);
    } catch (e) {
        console.error('EA scan error:', e);
    }

    try {
        console.log('Scanning Ubisoft...');
        results.ubisoft = await scanUbisoftGames();
        console.log(`Found ${results.ubisoft.length} Ubisoft games`);
    } catch (e) {
        console.error('Ubisoft scan error:', e);
    }

    // Load custom games
    try {
        if (fs.existsSync(CUSTOM_GAMES_FILE)) {
            results.custom = JSON.parse(fs.readFileSync(CUSTOM_GAMES_FILE, 'utf-8'));
            console.log(`Loaded ${results.custom.length} custom games`);
        }
    } catch (e) {
        console.error('Custom games load error:', e);
    }

    console.log('Scan complete!');
    return results;
}

export function saveCustomGames(games) {
    fs.writeFileSync(CUSTOM_GAMES_FILE, JSON.stringify(games, null, 2));
}

export function getCustomGamesPath() {
    return CUSTOM_GAMES_FILE;
}
