import { useState } from 'react';

function AddGameModal({ onClose, onAdd }) {
    const [name, setName] = useState('');
    const [exePath, setExePath] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && exePath) {
            onAdd({
                name,
                exePath,
                coverUrl: coverUrl || null,
                installDir: exePath.substring(0, exePath.lastIndexOf('\\'))
            });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Añadir Juego</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="game-name">Nombre del juego</label>
                        <input
                            id="game-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Minecraft"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="game-exe">Ruta del ejecutable (.exe)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                id="game-exe"
                                type="text"
                                value={exePath}
                                onChange={e => setExePath(e.target.value)}
                                placeholder="Ej: C:\Games\Minecraft\minecraft.exe"
                                required
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={async () => {
                                    if (window.electronAPI) {
                                        const path = await window.electronAPI.selectFile();
                                        if (path) {
                                            setExePath(path);
                                            // Auto-guess name if empty
                                            if (!name) {
                                                const filename = path.split('\\').pop().replace('.exe', '');
                                                setName(filename.charAt(0).toUpperCase() + filename.slice(1));
                                            }
                                        }
                                    }
                                }}
                            >
                                📂
                            </button>
                        </div>
                        <small>Escribe la ruta completa al archivo .exe del juego</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="game-cover">URL de la portada (opcional)</label>
                        <input
                            id="game-cover"
                            type="url"
                            value={coverUrl}
                            onChange={e => setCoverUrl(e.target.value)}
                            placeholder="https://example.com/cover.jpg"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Añadir Juego
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddGameModal;
