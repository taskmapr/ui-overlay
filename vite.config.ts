import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  css: {
    // Ensure CSS is properly extracted and bundled
    modules: false,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TaskMaprUIOverlay',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        // Ensure CSS is included in the bundle
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'taskmapr-overlay.css';
          return assetInfo.name || 'asset';
        }
      }
    },
    // Ensure CSS is extracted
    cssCodeSplit: false,
  }
})
