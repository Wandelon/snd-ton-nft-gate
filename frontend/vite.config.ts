import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// For GitHub Pages set BASE_PATH="/<repo-name>/"
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],
  base,
  define: {
    global: 'globalThis'
  }
});

