function TitleBar({ onRefresh, onAddGame, onOpenSettings, onSearch }) {
    const handleMinimize = () => window.electronAPI?.minimize();
    const handleMaximize = () => window.electronAPI?.maximize();
    const handleClose = () => window.electronAPI?.close();

    return (
        <header className="title-bar">
            <div className="title-bar-drag">
                <div className="app-logo">
                    <span className="logo-icon">🎮</span>
                    <h1>FKLauncher</h1>
                </div>
            </div>
            <div className="title-bar-search">
                <div className="search-input-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="title-bar-actions">
                <button className="action-btn refresh-btn" onClick={onRefresh} title="Actualizar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                </button>
                <button className="action-btn add-btn" onClick={onAddGame} title="Añadir juego">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <button className="action-btn settings-btn" onClick={onOpenSettings} title="Configuración">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>
            <div className="window-controls">
                <button className="window-btn minimize" onClick={handleMinimize}>
                    <svg viewBox="0 0 12 12"><rect y="5" width="10" height="1" fill="currentColor" /></svg>
                </button>
                <button className="window-btn maximize" onClick={handleMaximize}>
                    <svg viewBox="0 0 12 12"><rect x="1" y="1" width="9" height="9" fill="none" stroke="currentColor" /></svg>
                </button>
                <button className="window-btn close" onClick={handleClose}>
                    <svg viewBox="0 0 12 12">
                        <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" />
                        <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" />
                    </svg>
                </button>
            </div>
        </header >
    );
}

export default TitleBar;
