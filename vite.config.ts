import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  // No longer embedding API keys in the client bundle
  // Backend API URL can be configured via VITE_API_URL environment variable
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
