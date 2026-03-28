import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(openrouter\.ai|api\.calorieninjas\.com)/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern:
              /^https:\/\/.*\.(googleapis\.com|firebaseio\.com|firebaseapp\.com)/,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'Voice Health — Calorie Log',
        short_name: 'Voice Health',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  base: process.env.VITE_BASE || '/',
})
