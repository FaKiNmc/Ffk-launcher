
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { Jimp } = require('jimp');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processImage() {
    const inputPath = path.join(__dirname, '../public/banana-fk.png');

    try {
        const image = await Jimp.read(inputPath);

        // Get background color from top-left pixel (Index 0)
        const bgR = image.bitmap.data[0];
        const bgG = image.bitmap.data[1];
        const bgB = image.bitmap.data[2];

        console.log(`Background color detected: rgba(${bgR}, ${bgG}, ${bgB})`);

        // Scan and replace similar colors with transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // Calculate distance
            const dist = Math.sqrt(
                Math.pow(r - bgR, 2) +
                Math.pow(g - bgG, 2) +
                Math.pow(b - bgB, 2)
            );

            // If color is close to background (within tolerance), make it transparent
            if (dist < 30) {
                this.bitmap.data[idx + 3] = 0; // Alpha = 0
            }
        });

        await new Promise((resolve, reject) => {
            image.write(inputPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Background removed successfully!');

    } catch (err) {
        console.error('Error processing image:', err);
    }
}

processImage();
