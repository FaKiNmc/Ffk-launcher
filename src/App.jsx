import { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import GameGrid from './components/GameGrid';
import AddGameModal from './components/AddGameModal';
import EditGameModal from './components/EditGameModal';
import SettingsModal from './components/SettingsModal';

function App() {
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingGame, setEditingGame] = useState(null);
    const [customGames, setCustomGames] = useState([]);

    // Load saved colors on app start
    useEffect(() => {
        const saved = localStorage.getItem('fklauncher-colors');
        if (saved) {
            try {
                const colors = JSON.parse(saved);
                const root = document.documentElement;
                root.style.setProperty('--color-primary', colors.primary);
                root.style.setProperty('--color-bg', colors.background);
                root.style.setProperty('--color-surface', colors.surface);
                root.style.setProperty('--color-sidebar', colors.sidebar);
                root.style.setProperty('--color-text', colors.text);
                root.style.setProperty('--color-text-secondary', colors.textSecondary);
            } catch { }
        }
    }, []);

    const scanGames = useCallback(async () => {
        setIsLoading(true);
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.scanGames();
                const allGames = [
                    ...result.steam,
                    ...result.epic,
                    ...result.rockstar,
                    ...result.riot,
                    ...result.ea,
                    ...result.ubisoft,
                    ...result.custom
                ];
                setGames(allGames);
                setCustomGames(result.custom || []);
                setIsLoading(false);

                // Fetch covers in background after showing games
                const gamesWithCovers = await window.electronAPI.fetchCovers(allGames);
                setGames(gamesWithCovers);
            } else {
                // Mock data for development in browser
                setGames([
                    { id: 'demo_1', name: 'Counter-Strike 2', platform: 'steam', coverUrl: 'https://steamcdn-a.akamaihd.net/steam/apps/730/library_600x900.jpg' },
                    { id: 'demo_2', name: 'Fortnite', platform: 'epic', coverUrl: null },
                    { id: 'demo_3', name: 'GTA V', platform: 'rockstar', coverUrl: null },
                    { id: 'demo_4', name: 'VALORANT', platform: 'riot', coverUrl: null }
                ]);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error scanning games:', error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        scanGames();
    }, [scanGames]);

    const handleLaunchGame = async (game) => {
        if (window.electronAPI) {
            console.log('🚀 Launching game:', game.name);

            // Auto-Close Logic (Check BEFORE launching to debug)
            const savedSettings = localStorage.getItem('fklauncher-colors');
            console.log('💾 Saved Settings:', savedSettings);

            let shouldMinimize = false;
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.autoClose) {
                    shouldMinimize = true;
                }
            }
            console.log('⚡ Should Minimize:', shouldMinimize);

            await window.electronAPI.launchGame(game.exePath, game.isCommand, game.id);

            if (shouldMinimize) {
                console.log('📉 Minimizing window...');
                window.electronAPI.minimize();
            }
        }
    };

    const handleAddGame = async (newGame) => {
        const gameWithId = { ...newGame, platform: 'custom', id: `custom_${Date.now()}` };

        // Save to backend
        if (window.electronAPI) {
            await window.electronAPI.saveCustomGame(gameWithId);
        }

        // Update local state (optimistic)
        const updatedCustom = [...customGames, gameWithId];
        setCustomGames(updatedCustom);
        setGames(prev => [...prev, gameWithId]);
        setShowAddModal(false);
    };

    const filteredGames = games.filter(game => {
        const matchesPlatform = filter === 'all' || game.platform === filter;
        const name = game.name || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesPlatform && matchesSearch;
    });

    const handleEditGame = (game) => {
        setEditingGame(game);
        setShowEditModal(true);
    };

    const handleSaveCover = async (gameId, newCoverUrl) => {
        if (window.electronAPI) {
            await window.electronAPI.saveCustomCover(gameId, newCoverUrl);
            // Refresh games to apply changes (or update state manually)
            scanGames();
        }
        setShowEditModal(false);
        setEditingGame(null);
    };

    const handleDeleteGame = async (game) => {
        if (confirm(`¿Estás seguro de que quieres eliminar "${game.name}"?`)) {
            if (window.electronAPI) {
                await window.electronAPI.deleteCustomGame(game.id);

                // Update local state
                const newCustom = customGames.filter(g => g.id !== game.id);
                setCustomGames(newCustom);
                setGames(prev => prev.filter(g => g.id !== game.id));
            }
        }
    };

    return (
        <div className="app">
            <TitleBar
                onRefresh={scanGames}
                onAddGame={() => setShowAddModal(true)}
                onOpenSettings={() => setShowSettingsModal(true)}
                onSearch={setSearchTerm}
            />
            <div className="app-content">
                <Sidebar activeFilter={filter} onFilterChange={setFilter} />
                <main className="main-content">
                    {isLoading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Escaneando juegos...</p>
                        </div>
                    ) : (
                        <GameGrid
                            games={filteredGames}
                            onLaunch={handleLaunchGame}
                            onEdit={handleEditGame}
                            onDelete={handleDeleteGame}
                        />
                    )}
                </main>
            </div>
            {showAddModal && (
                <AddGameModal onClose={() => setShowAddModal(false)} onAdd={handleAddGame} />
            )}
            {showEditModal && editingGame && (
                <EditGameModal
                    game={editingGame}
                    onClose={() => { setShowEditModal(false); setEditingGame(null); }}
                    onSave={handleSaveCover}
                />
            )}
            {showSettingsModal && (
                <SettingsModal onClose={() => setShowSettingsModal(false)} />
            )}
        </div>
    );
}

export default App;

