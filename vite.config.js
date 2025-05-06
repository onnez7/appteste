import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      '@mediapipe/face_mesh': path.resolve(__dirname, 'node_modules/@mediapipe/face_mesh'),
    },
  },
});