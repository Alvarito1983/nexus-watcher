import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9091,
    proxy: {
      '/api': 'http://localhost:3002',
      '/health': 'http://localhost:3002',
      '/status': 'http://localhost:3002',
    },
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});
