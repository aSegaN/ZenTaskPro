import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Clé Gemini retirée du bundle client : les appels IA passent par le backend (/api/ai/*).
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Découpage du bundle pour réduire le poids initial
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
                if (id.includes('lucide-react')) return 'vendor-icons';
                if (id.includes('axios')) return 'vendor-http';
                return 'vendor';
              }
            },
          },
        },
      },
    };
});
