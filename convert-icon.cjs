const fs = require('fs');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;
const { Jimp } = require('jimp');

console.log('Jimp export type:', typeof Jimp);
console.log('Jimp keys:', Object.keys(Jimp));

async function convert() {
    try {
        console.log('Processing icon with Jimp...');
        const image = await Jimp.read('build/icon.png');
        image.resize({ w: 256, h: 256 });
        const buffer = await image.getBuffer('image/png');

        console.log('Converting to ICO...');
        const icoBuf = await pngToIco(buffer);
        fs.writeFileSync('build/icon.ico', icoBuf);
        console.log('Success: build/icon.ico created');
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

convert();
