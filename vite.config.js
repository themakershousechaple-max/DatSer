import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Ensure assets resolve correctly when served under /DatSer/ on GitHub Pages
  base: '/DatSer/',
  server: {
    port: 3000,
    host: true
  }
})