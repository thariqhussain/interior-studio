import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        // libraries change rarely, so they get their own files: cached across deploys and downloaded in parallel with the app code
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          scroll: ['gsap', 'lenis'],
        },
      },
    },
  },
})
