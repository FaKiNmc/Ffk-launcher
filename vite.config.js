import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'vite-plugin-javascript-obfuscator'

export default defineConfig({
    plugins: [
        react(),
        obfuscator({
            options: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                numbersToExpressions: true,
                simplify: true,
                stringArrayThreshold: 0.75,
                splitStrings: true,
                splitStringsChunkLength: 10,
                unicodeEscapeSequence: true
            }
        })
    ],
    base: './',
    build: {
        outDir: 'dist'
    }
})
