// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 3030
  },
  modules: ['@nuxt/ui', '@nuxt/scripts', '@nuxt/eslint', '@pinia/nuxt', '@nuxtjs/i18n'],
  ssr: false,
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'sq', iso: 'sq-AL', name: 'Shqip' },
      { code: 'sr', iso: 'sr-RS', name: 'Српски' }
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
    }
  }
})