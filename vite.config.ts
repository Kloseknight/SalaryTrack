
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Bridges Vercel/System environment variables to the browser code
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
