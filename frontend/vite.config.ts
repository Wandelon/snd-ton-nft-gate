import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages set BASE_PATH="/<repo-name>/"
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  plugins: [react()],
  base
});

