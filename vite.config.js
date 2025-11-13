import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https-server för lokal utveckling
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('localhost-key.pem'),
      cert: fs.readFileSync('localhost.pem'),
    },
    host: '0.0.0.0',
    port: 5173,
  },
})
