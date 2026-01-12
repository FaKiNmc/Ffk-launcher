class SoundManager {
    constructor() {
        // Use referencing via public folder
        this.hoverSound = new Audio('sounds/hover.wav');
        this.clickSound = new Audio('sounds/click.wav');

        // Default volumes
        this.hoverSound.volume = 0.15; // Subtle
        this.clickSound.volume = 0.3;  // Distinct
    }

    playHover() {
        // User requested to remove hover sound ("deja solo el de jugar")
        // Keeping method to avoid breaking imports, but it does nothing.
        return;
    }

    playClick() {
        const sound = this.clickSound.cloneNode();
        sound.volume = this.clickSound.volume;
        sound.play().catch(() => {
            // Silent catch
        });
    }
}

export const soundManager = new SoundManager();
