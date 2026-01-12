import React, { useState, useEffect } from 'react';
import './SettingsModal.css'; // Reuse settings styles

function EditGameModal({ game, onClose, onSave }) {
    const [coverUrl, setCoverUrl] = useState('');

    useEffect(() => {
        if (game) {
            setCoverUrl(game.coverUrl || '');
        }
    }, [game]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(game.id, coverUrl);
    };

    if (!game) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Editar Juego: {game.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>URL de la Portada (Deja vacío para automático)</label>
                        <input
                            type="text"
                            value={coverUrl}
                            onChange={(e) => setCoverUrl(e.target.value)}
                            placeholder="https://..."
                            className="modal-input"
                        />
                    </div>

                    {coverUrl && (
                        <div className="preview-container" style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <p style={{ marginBottom: '0.5rem', opacity: 0.7 }}>Vista previa:</p>
                            <img
                                src={coverUrl}
                                alt="Preview"
                                style={{ maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }}
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-confirm">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditGameModal;
