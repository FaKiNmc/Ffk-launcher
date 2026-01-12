import React from 'react';
import { soundManager } from '../utils/audio';

function UpdateModal({ updateData, onClose }) {
    if (!updateData) return null;

    const { version, url, notes } = updateData;

    const handleDownload = () => {
        soundManager.playClick();
        window.electronAPI.openExternal(url);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#1e1e24',
                border: '1px solid #6366f1',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '450px',
                width: '90%',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        fontSize: '20px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>✨</div>
                    <h2 style={{ margin: 0, color: 'white' }}>Actualización Recomendada</h2>
                    <p style={{ color: '#888', marginTop: '5px' }}>Nueva versión <strong>{version}</strong> disponible.</p>
                </div>

                {notes && (
                    <div style={{
                        background: '#15151a',
                        padding: '15px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#ccc',
                        marginBottom: '20px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        border: '1px solid #333'
                    }}>
                        {notes}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleDownload}
                        onMouseEnter={() => soundManager.playHover()}
                        style={{
                            flex: 1,
                            backgroundColor: '#6366f1',
                            color: 'white',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        ⬇️ Descargar
                    </button>
                    <button
                        onClick={onClose}
                        onMouseEnter={() => soundManager.playHover()}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            color: '#888',
                            border: '1px solid #444',
                            padding: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Quizás luego
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpdateModal;
