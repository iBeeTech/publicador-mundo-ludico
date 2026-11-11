export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  // Fora da Cloudflare o Nitro não detecta o destino e gera .output/ (Node).
  // Fixando o preset, `npm run build` sempre gera dist/ pronto para o Pages.
  nitro: { preset: 'cloudflare-pages' },
  runtimeConfig: {
    public: {
      // Worker que entrega os jogos com o tipo de arquivo certo (pasta entregador/).
      // O Supabase Storage não deixa HTML rodar direto do bucket.
      // Pode ser trocado no build com NUXT_PUBLIC_JOGOS_BASE_URL.
      jogosBaseUrl: 'https://jogos-mundo-ludico.stakarada.workers.dev'
    }
  },
  supabase: {
    // A proteção das rotas é feita pelo middleware app/middleware/auth.ts,
    // para que a galeria pública continue aberta a quem não tem conta.
    redirect: false
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0098da' },
        // Prévia ao compartilhar o link (WhatsApp, redes sociais): logo da escola.
        { property: 'og:site_name', content: 'Escola Mundo Lúdico' },
        { property: 'og:title', content: 'Arcade Mundo Lúdico — jogos feitos pelos alunos' },
        {
          property: 'og:description',
          content: 'Jogue os jogos criados pelos alunos da Escola Mundo Lúdico, em Franca - SP.'
        },
        { property: 'og:image', content: 'https://publicador-mundo-ludico.pages.dev/logo-mundo-ludico.png' }
      ],
      link: [
        // Ícone da aba: a logo da escola.
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Inter:wght@400;500;600&display=swap'
        }
      ]
    }
  }
})
