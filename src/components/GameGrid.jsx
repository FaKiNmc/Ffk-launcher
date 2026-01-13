import GameCard from './GameCard';

function GameGrid({ games, onLaunch, onEdit, onDelete, selectedIndex }) {
    if (!games || games.length === 0) {
        return <div className="no-games">No se encontraron juegos.</div>;
    }

    return (
        <div className="game-grid">
            {games.map((game, index) => (
                <GameCard
                    key={game.id}
                    game={game}
                    onLaunch={onLaunch}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isSelected={index === selectedIndex}
                />
            ))}
        </div>
    );
}

export default GameGrid;

