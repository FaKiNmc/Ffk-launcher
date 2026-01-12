import { useState, useEffect } from 'react';

const platformColors = {
    steam: '#1b2838',
    epic: '#2a2a2a',
    rockstar: '#fcaf17',
    riot: '#d13639',
    ea: '#ff4747',
    ubisoft: '#0070c9',
    custom: '#8b5cf6'
};

const platformNames = {
    steam: 'Steam',
    epic: 'Epic',
    rockstar: 'R★',
    riot: 'Riot',
    ea: 'EA',
    ubisoft: 'Ubi',
    custom: 'Custom'
};

function GameCard({ game, onLaunch, onEdit, onDelete }) {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Reset imageError when coverUrl changes
    useEffect(() => {
        setImageError(false);
    }, [game.coverUrl]);

    const handleImageError = () => {
        setImageError(true);
    };

    const badgeColor = platformColors[game.platform] || platformColors.custom;
    const badgeName = platformNames[game.platform] || platformNames.custom;
    const PlatformLogo = null;

    return (
        <div
            className="game-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="game-card-image-container" onClick={() => onLaunch(game)}>
                {imageError || !game.coverUrl ? (
                    <div className={`game-card-placeholder ${game.platform}`} style={{ background: `linear-gradient(135deg, ${badgeColor} 0%, #1a1a2e 100%)` }}>
                        <span className="game-title-text">{game.name}</span>
                        {PlatformLogo && <img src={PlatformLogo} alt={game.platform} className="platform-logo-fallback" />}
                    </div>
                ) : (
                    <img
                        src={game.coverUrl}
                        alt={game.name}
                        className="game-card-image"
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}

                {/* Playtime Badge (Top Left) */}
                {game.playTime > 0 && (
                    <div className="playtime-badge">
                        ⏳ {Math.floor(game.playTime / 60) > 0 ? `${Math.floor(game.playTime / 60)}h ` : ''}
                        {game.playTime % 60}m
                    </div>
                )}

                {/* Platform Badge */}
                <div className="platform-badge" style={{ backgroundColor: badgeColor }}>
                    {badgeName}
                </div>

                {/* Overlay with Actions */}
                <div className={`game-card-overlay ${isHovered ? 'visible' : ''}`}>
                    <div className="overlay-content">
                        <button className="play-button">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                            <span>JUGAR</span>
                        </button>

                        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="card-action-btn edit-btn"
                                title="Editar Portada"
                                onClick={(e) => { e.stopPropagation(); onEdit(game); }}
                            >
                                ✏️
                            </button>
                            {game.platform === 'custom' && (
                                <button
                                    className="card-action-btn delete-btn"
                                    title="Eliminar Juego"
                                    onClick={(e) => { e.stopPropagation(); onDelete(game); }}
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="game-card-info">
                <h3 className="game-title">{game.name}</h3>
            </div>
        </div>
    );
}

export default GameCard;
