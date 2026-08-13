import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reticle } from '@reticlehq/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    reticle(),
  ],
})
