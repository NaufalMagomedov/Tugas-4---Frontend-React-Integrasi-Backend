import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // strictPort: gagal tegas bila 5173 terpakai, bukan pindah port diam-diam
  // (CORS_ORIGIN di backend harus sama persis dengan port ini).
  server: { port: 5173, strictPort: true },
})
