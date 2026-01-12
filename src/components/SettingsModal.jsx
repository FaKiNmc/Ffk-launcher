import { useState, useEffect } from 'react';
import './SettingsModal.css';

const DEFAULT_COLORS = {
    primary: '#dc2626',      // Red accent
    background: '#050505',   // Dark background
    surface: '#0a0a0a',      // Card/surface background
    sidebar: '#080808',      // Sidebar background
    text: '#ffffff',         // Main text
    textSecondary: '#888888' // Secondary text
};

function SettingsModal({ onClose }) {
    const [colors, setColors] = useState(DEFAULT_COLORS);

    useEffect(() => {
        // Load saved colors on mount
        const saved = localStorage.getItem('fklauncher-colors');
        if (saved) {
            try {
                setColors(JSON.parse(saved));
            } catch { }
        }
    }, []);

    const handleColorChange = (key, value) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const applyColors = () => {
        // Apply colors to CSS variables
        const root = document.documentElement;
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-bg', colors.background);
        root.style.setProperty('--color-surface', colors.surface);
        root.style.setProperty('--color-sidebar', colors.sidebar);
        root.style.setProperty('--color-text', colors.text);
        root.style.setProperty('--color-text-secondary', colors.textSecondary);

        // Save to localStorage
        localStorage.setItem('fklauncher-colors', JSON.stringify(colors));
    };

    const resetToDefaults = () => {
        setColors(DEFAULT_COLORS);

        // Apply default colors
        const root = document.documentElement;
        root.style.setProperty('--color-primary', DEFAULT_COLORS.primary);
        root.style.setProperty('--color-bg', DEFAULT_COLORS.background);
        root.style.setProperty('--color-surface', DEFAULT_COLORS.surface);
        root.style.setProperty('--color-sidebar', DEFAULT_COLORS.sidebar);
        root.style.setProperty('--color-text', DEFAULT_COLORS.text);
        root.style.setProperty('--color-text-secondary', DEFAULT_COLORS.textSecondary);

        // Clear localStorage
        localStorage.removeItem('fklauncher-colors');
    };

    const handleSave = () => {
        applyColors();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ Configuración</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    <h3>🎨 Personalizar Colores</h3>

                    <div className="color-grid">
                        <div className="color-option">
                            <label>Color Principal (Acento)</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={colors.primary}
                                    onChange={e => handleColorChange('primary', e.target.value)}
                                />
                                <span className="color-value">{colors.primary}</span>
                            </div>
                        </div>

                        <div className="color-option">
                            <label>Fondo Principal</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={colors.background}
                                    onChange={e => handleColorChange('background', e.target.value)}
                                />
                                <span className="color-value">{colors.background}</span>
                            </div>
                        </div>

                        <div className="color-option">
                            <label>Tarjetas / Superficies</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={colors.surface}
                                    onChange={e => handleColorChange('surface', e.target.value)}
                                />
                                <span className="color-value">{colors.surface}</span>
                            </div>
                        </div>

                        <div className="color-option">
                            <label>Barra Lateral</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={colors.sidebar}
                                    onChange={e => handleColorChange('sidebar', e.target.value)}
                                />
                                <span className="color-value">{colors.sidebar}</span>
                            </div>
                        </div>

                        <div className="color-option">
                            <label>Texto Principal</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={colors.text}
                                    onChange={e => handleColorChange('text', e.target.value)}
                                />
                                <span className="color-value">{colors.text}</span>
                            </div>
                        </div>

                        <div className="color-option">
                            <label>Texto Secundario</label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={colors.textSecondary}
                                    onChange={e => handleColorChange('textSecondary', e.target.value)}
                                />
                                <span className="color-value">{colors.textSecondary}</span>
                            </div>
                        </div>
                    </div>

                    <h3>⚡ Comportamiento</h3>
                    <div className="behavior-section">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                name="autoClose"
                                checked={colors.autoClose || false}
                                onChange={(e) => handleColorChange('autoClose', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            <span className="checkbox-label">Minimizar launcher al abrir un juego</span>
                        </label>
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="reset-btn" onClick={resetToDefaults}>
                        🔄 Restablecer Colores
                    </button>
                    <div className="action-buttons">
                        <button className="cancel-btn" onClick={onClose}>Cancelar</button>
                        <button className="save-btn" onClick={handleSave}>Guardar</button>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default SettingsModal;
