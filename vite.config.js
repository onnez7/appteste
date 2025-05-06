import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@tensorflow-models/blazeface', '@tensorflow/tfjs', '@mediapipe/face_mesh'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  server: {
    watch: {
      usePolling: true, // Useful for Windows/WSL2 environments
    },
  },
});