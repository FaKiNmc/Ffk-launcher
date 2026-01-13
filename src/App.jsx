import { useState, useEffect, useCallback, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import GameGrid from './components/GameGrid';
import AddGameModal from './components/AddGameModal';
import EditGameModal from './components/EditGameModal';
import SettingsModal from './components/SettingsModal';
import UpdateModal from './components/UpdateModal';

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
    const [updateData, setUpdateData] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchInputRef = useRef(null);

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
                    ...(result.xbox || []),
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

    // Check for updates
    useEffect(() => {
        // Initial check
        const checkUpdates = async () => {
            if (window.electronAPI?.checkForUpdates) {
                await window.electronAPI.checkForUpdates();
            }
        };

        // Listen for results
        if (window.electronAPI?.onUpdateAvailable) {
            window.electronAPI.onUpdateAvailable((data) => {
                console.log('Update available event:', data);
                setUpdateData(data);
                // Automatically show if it's a real update context
                setShowUpdateModal(true);
            });
        }

        checkUpdates();
    }, []);

    // Compute filtered games first (needed for keyboard navigation)
    const filteredGames = games.filter(game => {
        const matchesPlatform = filter === 'all' || game.platform === filter;
        const name = game.name || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesPlatform && matchesSearch;
    });

    // Launch game handler (defined early for keyboard shortcuts)
    const handleLaunchGame = async (game) => {
        if (window.electronAPI) {
            console.log('🚀 Launching game:', game.name);
            const savedSettings = localStorage.getItem('fklauncher-colors');
            let shouldMinimize = false;
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.autoClose) {
                    shouldMinimize = true;
                }
            }
            await window.electronAPI.launchGame(game.exePath, game.isCommand, game.id, game.requiresRiotClient, game.useShellLaunch);
            if (shouldMinimize) {
                window.electronAPI.minimize();
            }
        }
    };

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA';

            // Escape - Close any modal
            if (e.key === 'Escape') {
                if (showAddModal) setShowAddModal(false);
                if (showEditModal) { setShowEditModal(false); setEditingGame(null); }
                if (showSettingsModal) setShowSettingsModal(false);
                if (showUpdateModal) setShowUpdateModal(false);
                // Deselect game
                setSelectedIndex(-1);
                return;
            }

            // Don't process other shortcuts if typing in input
            if (isInputFocused) return;

            // Ctrl+F - Focus search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }

            // Ctrl+R - Refresh games
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                scanGames();
                return;
            }

            // Navigation and actions only when no modal is open
            const anyModalOpen = showAddModal || showEditModal || showSettingsModal || showUpdateModal;
            if (anyModalOpen) return;

            // Enter - Launch selected game
            if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < filteredGames.length) {
                e.preventDefault();
                handleLaunchGame(filteredGames[selectedIndex]);
                return;
            }

            // Arrow navigation - calculate columns based on grid width
            const gridElement = document.querySelector('.game-grid');
            const gameCards = document.querySelectorAll('.game-card');
            let columns = 4; // default
            if (gridElement && gameCards.length > 1) {
                // Count how many cards fit in first row by checking their Y position
                const firstCardTop = gameCards[0].getBoundingClientRect().top;
                columns = 0;
                for (const card of gameCards) {
                    if (Math.abs(card.getBoundingClientRect().top - firstCardTop) < 10) {
                        columns++;
                    } else {
                        break;
                    }
                }
                columns = Math.max(1, columns);
            }
            const totalGames = filteredGames.length;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setSelectedIndex(prev => prev < totalGames - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : totalGames - 1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    const next = prev + columns;
                    // If no game directly below, go to last game
                    return next < totalGames ? next : totalGames - 1;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    const next = prev - columns;
                    // If no game directly above, go to first game
                    return next >= 0 ? next : 0;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAddModal, showEditModal, showSettingsModal, showUpdateModal, selectedIndex, filteredGames, scanGames, handleLaunchGame]);

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
            {showUpdateModal && (
                <UpdateModal
                    updateData={updateData}
                    onClose={() => setShowUpdateModal(false)}
                />
            )}
            <TitleBar
                onRefresh={scanGames}
                onAddGame={() => setShowAddModal(true)}
                onOpenSettings={() => setShowSettingsModal(true)}
                onSearch={setSearchTerm}
                updateData={updateData}
                searchInputRef={searchInputRef}
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
                            selectedIndex={selectedIndex}
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

