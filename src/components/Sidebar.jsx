// Official logos with refined styles
const launcherIcons = {
    // Steam: Official logo
    steam: (
        <img
            src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg"
            alt="Steam"
            style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.9)' }}
        />
    ),

    // Epic: Configuration confirmed by USER as perfect. DO NOT TOUCH.
    // Wikimedia SVG (black) + invert(1).
    epic: (
        <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/31/Epic_Games_logo.svg"
            alt="Epic"
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1)', transform: 'scale(0.8)' }}
        />
    ),

    // Rockstar: Official logo
    rockstar: (
        <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Rockstar_Games_Logo.svg"
            alt="Rockstar"
            style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.8)' }}
        />
    ),

    // Riot: Using SimpleIcons CDN for a perfect, clean white icon.
    riot: (
        <img
            src="https://cdn.simpleicons.org/riotgames/white"
            alt="Riot"
            style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.7)' }}
        />
    ),

    // EA: Simple text-based logo for reliability
    ea: (
        <span style={{
            fontWeight: '900',
            fontSize: '14px',
            color: 'white',
            letterSpacing: '-1px',
            fontFamily: 'Arial, sans-serif'
        }}>EA</span>
    ),

    // Ubisoft: Official logo from Wikimedia with white filter
    ubisoft: (
        <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Ubisoft_logo.svg"
            alt="Ubisoft"
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)', transform: 'scale(0.8)' }}
        />
    ),

    // Xbox/Game Pass: Official Xbox logo
    xbox: (
        <img
            src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg"
            alt="Xbox"
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)', transform: 'scale(0.85)' }}
        />
    )
};

const launchers = [
    { id: 'all', name: 'Todos', icon: '🎮', color: '#6366f1' },
    { id: 'steam', name: 'Steam', icon: null, color: '#1b2838' },
    { id: 'epic', name: 'Epic Games', icon: null, color: '#2a2a2a' },
    { id: 'rockstar', name: 'Rockstar', icon: null, color: '#fcaf17' },
    { id: 'riot', name: 'Riot Games', icon: null, color: '#d13639' },
    { id: 'ea', name: 'EA App', icon: null, color: '#ff4747' },
    { id: 'ubisoft', name: 'Ubisoft', icon: null, color: '#0070ff' },
    { id: 'xbox', name: 'Game Pass', icon: null, color: '#107c10' },
    { id: 'custom', name: 'Mis Juegos', icon: '📁', color: '#8b5cf6' }
];

import { soundManager } from '../utils/audio';

function SidebarComponent({ activeFilter, onFilterChange }) {
    const handleOpenLauncher = async (launcherId) => {
        if (window.electronAPI && launcherId !== 'all' && launcherId !== 'custom') {
            await window.electronAPI.openLauncher(launcherId);
        }
    };

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-section-title">Biblioteca</span>
                    {launchers.map(launcher => (
                        <button
                            key={launcher.id}
                            className={`nav-item ${activeFilter === launcher.id ? 'active' : ''}`}
                            onClick={() => {
                                soundManager.playClick();
                                onFilterChange(launcher.id);
                            }}
                            onMouseEnter={() => soundManager.playHover()}
                            style={{ '--launcher-color': launcher.color }}
                        >
                            <span className="nav-icon" style={{ backgroundColor: launcher.color }}>
                                {launcher.icon || launcherIcons[launcher.id]}
                            </span>
                            <span className="nav-label">{launcher.name}</span>
                        </button>
                    ))}
                </div>



                <div className="nav-section">
                    <span className="nav-section-title">Abrir Launcher</span>
                    {launchers.filter(l => !['all', 'custom'].includes(l.id)).map(launcher => (
                        <button
                            key={`open_${launcher.id}`}
                            className="nav-item launcher-btn"
                            onClick={() => {
                                soundManager.playClick();
                                handleOpenLauncher(launcher.id);
                            }}
                            onMouseEnter={() => soundManager.playHover()}
                            style={{ '--launcher-color': launcher.color }}
                        >
                            <span className="nav-icon" style={{ backgroundColor: launcher.color }}>
                                {launcherIcons[launcher.id]}
                            </span>
                            <span className="nav-label">Abrir {launcher.name}</span>
                            <span className="external-icon">↗</span>
                        </button>
                    ))}
                </div>
            </nav>
        </aside>
    );
}

export default SidebarComponent;
