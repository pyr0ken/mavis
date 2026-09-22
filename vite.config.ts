import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-katex': ['katex', 'rehype-katex', 'remark-math'],
          'vendor-prism': ['prismjs'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-gsap': ['gsap'],
          'vendor-blobatar': ['@blobatar/react', 'blobatar'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

