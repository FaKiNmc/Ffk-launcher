import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../electron');
const outputDir = path.join(__dirname, '../dist-electron-pkg/electron');

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const obfuscateFile = (fileName) => {
    const inputPath = path.join(inputDir, fileName);
    const outputPath = path.join(outputDir, fileName);

    if (fs.lstatSync(inputPath).isDirectory()) {
        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);
        fs.readdirSync(inputPath).forEach(file => obfuscateFile(path.join(fileName, file)));
        return;
    }

    if (!fileName.endsWith('.js')) {
        fs.copyFileSync(inputPath, outputPath);
        return;
    }

    console.log(`🔒 Obfuscating: ${fileName}`);
    const code = fs.readFileSync(inputPath, 'utf8');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: true,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: true
    }).getObfuscatedCode();

    fs.writeFileSync(outputPath, obfuscatedCode);
};

// Start
fs.readdirSync(inputDir).forEach(file => obfuscateFile(file));
console.log('✅ Main process obfuscated successfully!');
