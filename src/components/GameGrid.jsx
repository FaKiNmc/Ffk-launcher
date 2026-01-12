import GameCard from './GameCard';

function GameGrid({ games, onLaunch, onEdit, onDelete }) {
    if (!games || games.length === 0) {
        return <div className="no-games">No se encontraron juegos.</div>;
    }

    return (
        <div className="game-grid">
            {games.map((game) => (
                <GameCard
                    key={game.id}
                    game={game}
                    onLaunch={onLaunch}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

export default GameGrid;
