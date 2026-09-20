import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/playwright/gallery/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@/*': './src/*',
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});