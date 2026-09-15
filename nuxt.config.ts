// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
