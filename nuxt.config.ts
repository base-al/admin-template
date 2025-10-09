// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // DevTools configuration
  devtools: {
    enabled: true,
    // Customize DevTools behavior
    timeline: {
      enabled: true
    }
  },

  // Development server configuration
  devServer: {
    port: 3030,
    host: '0.0.0.0', // Enable network access by default
    // Custom loading template (optional - can customize the loading screen)
    // loadingTemplate: './app/loading.html',
  },

  // Logging configuration
  logLevel: process.env.NUXT_LOG_LEVEL || 'info', // 'silent' | 'info' | 'verbose'

  // Vite configuration for dev server
  vite: {
    clearScreen: false, // Don't clear terminal on reload
    server: {
      // Customize Vite server messages
      hmr: {
        overlay: true // Show errors as overlay
      }
    },
    // Reduce console noise during build
    logLevel: process.env.VITE_LOG_LEVEL || 'info'
  },
  modules: ['@nuxt/ui', '@nuxt/scripts', '@nuxt/eslint', '@pinia/nuxt', '@nuxtjs/i18n'],

  // SPA mode configuration
  ssr: false,

  // Customize SPA loading indicator
  spaLoadingTemplate: true, // Use default Nuxt loading template
  // Or provide custom template path: './app/spa-loading-template.html'
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'de', iso: 'de-DE', name: 'Deutsch' },
      { code: 'fr', iso: 'fr-FR', name: 'Français' },
      { code: 'it', iso: 'it-IT', name: 'Italiano' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      // In production (static), use relative API URL since frontend is served from backend
      // In development, use full URL for dev proxy
      apiBase: process.env.NODE_ENV === 'production'
        ? '/api'
        : (process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'),
      apiKey: process.env.NUXT_PUBLIC_API_KEY || 'api'
    }
  },
   
  nitro: {
    devProxy: {
      '/api': 'http://localhost:8000/api',
      '/health': 'http://localhost:8000/health'
    },
    // Reduce console noise
    logLevel: process.env.NITRO_LOG_LEVEL as any || 1, // 0=silent, 1=error, 2=warn, 3=info, 4=debug
    timing: false // Disable timing info
  }
})