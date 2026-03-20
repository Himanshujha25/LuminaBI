import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'LuminaBI – Conversational Business Intelligence',
        short_name: 'LuminaBI',
        description: 'Ask anything about your data — AI-powered charts and insights instantly.',
        theme_color: '#6366f1',
        background_color: '#0B0F19',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Open main dashboard',
            url: '/dashboard',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['business', 'productivity', 'utilities'],
      },
      workbox: {
        // Cache the app shell and static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Network-first for API calls so data stays fresh
        runtimeCaching: [
          {
            urlPattern: /^(https:\/\/luminabi\.onrender\.com|http:\/\/localhost:5000)\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'lumina-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24h
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },

      devOptions: {
        enabled: true, // show SW in dev mode too
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
})
