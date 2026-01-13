import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/audio';

function UpdateModal({ updateData, onClose }) {
    const [progress, setProgress] = useState(0);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (window.electronAPI?.onDownloadProgress) {
            window.electronAPI.onDownloadProgress((p) => {
                setProgress(Math.round(p));
            });
        }
        if (window.electronAPI?.onUpdateDownloaded) {
            window.electronAPI.onUpdateDownloaded(() => {
                setIsDownloaded(true);
                setProgress(100);
            });
        }
        if (window.electronAPI?.onUpdateError) {
            window.electronAPI.onUpdateError((err) => {
                setError(err);
            });
        }
    }, []);

    const handleInstall = () => {
        soundManager.playClick();
        if (window.electronAPI?.installUpdate) {
            window.electronAPI.installUpdate();
        }
    };

    if (!updateData) return null;

    const { version, notes } = updateData;

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
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚀</div>
                    <h2 style={{ margin: 0, color: 'white' }}>
                        {error ? 'Ups, algo falló' : (isDownloaded ? '¡Lista para instalar!' : 'Actualización en curso')}
                    </h2>
                    <p style={{ color: error ? '#f87171' : '#888', marginTop: '5px' }}>
                        {error ? error : `Versión ${version}`}
                    </p>
                </div>

                {!isDownloaded && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            height: '8px',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '10px'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${progress}%`,
                                backgroundColor: '#6366f1',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <p style={{ textAlign: 'right', fontSize: '12px', color: '#6366f1', margin: 0 }}>
                            {progress}% descargado
                        </p>
                    </div>
                )}

                {notes && !isDownloaded && (
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
                    {isDownloaded ? (
                        <button
                            onClick={handleInstall}
                            onMouseEnter={() => soundManager.playHover()}
                            style={{
                                flex: 1,
                                backgroundColor: '#4ade80',
                                color: '#052c1e',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '800'
                            }}
                        >
                            🔄 Instalar y Reiniciar
                        </button>
                    ) : (
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
                            Seguir usando (segundo plano)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UpdateModal;
