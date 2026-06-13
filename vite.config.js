import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'App Comunicación Interna',
        short_name: 'ComunicacionApp',
        description: 'MVP de comunicación interna y valores de empresa',
        theme_color: '#4f46e5', // El color índigo de tu cabecera
        background_color: '#f9fafb',
        display: 'standalone', // Hace que se abra sin barras de navegador
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})