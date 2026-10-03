import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { coopyData } from './vite/data-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), coopyData()],
})
