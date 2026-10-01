import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],

  /*
   * Laravel serves the built app from public/app, so a production build puts
   * its assets under /app/. The dev server has no such prefix: with it, the
   * app only loaded at /app/login, where the router saw an unknown path and
   * showed Not Found, and /login itself was a 404.
   */
  base: command === 'build' ? '/app/' : '/',

  build: {
    outDir: '../backend/public/app',
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    strictPort: true,

    /*
     * The app calls the API on its own origin (/api/v1). In production that
     * origin is Laravel; in development it is this server, so API calls are
     * forwarded to Laravel rather than answered with 404. 127.0.0.1 rather
     * than localhost, because Node may resolve localhost to IPv6 while
     * `artisan serve` listens on IPv4. Docker sets its own target.
     */
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
}));
