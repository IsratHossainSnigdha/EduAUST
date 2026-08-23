import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Google Sign-In only accepts origins registered on the OAuth client, so
    // the dev server must not silently drift to 5174 when 5173 is taken.
    // Failing loudly is better than serving from an origin Google rejects.
    port: 5173,
    strictPort: true,
  },
}); 