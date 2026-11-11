<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const urlDoJogo = useJogoUrl()

const { data: jogo } = await useAsyncData(`jogo-${route.params.id}`, async () => {
  const { data, error } = await supabase
    .from('vw_jogos_publicos')
    .select('*')
    .eq('id', route.params.id as string)
    .maybeSingle()
  if (error) return null
  return data as unknown as {
    id: string; titulo: string; descricao: string | null; pasta: string
    largura: number; altura: number; autor: string
  } | null
})

const src = computed(() => (jogo.value ? urlDoJogo(jogo.value.pasta) : null))
const palco = ref<HTMLElement | null>(null)
const quadro = ref<HTMLIFrameElement | null>(null)

// O jogo roda dentro de um iframe. Sem foco nele, as teclas vão para esta
// página (e as setas só rolam a tela). Por isso o foco vai para o jogo
// assim que ele carrega, e de novo quando a pessoa clica em volta dele.
function focarJogo() {
  quadro.value?.focus()
}

// Conta uma jogada por jogo a cada sessão do navegador.
onMounted(async () => {
  if (!jogo.value) return
  const chave = `jogou-${jogo.value.id}`
  try {
    if (sessionStorage.getItem(chave)) return
    sessionStorage.setItem(chave, '1')
  } catch {
    /* navegação privada sem storage: conta mesmo assim */
  }
  const { error } = await supabase.rpc('registrar_jogada', { jogo: jogo.value.id })
  if (error) console.error('Não foi possível registrar a jogada', error.message)
})

// O iPhone não deixa elementos da página entrarem em tela cheia: lá o botão some.
const podeTelaCheia = ref(false)
onMounted(() => {
  podeTelaCheia.value = Boolean(document.fullscreenEnabled && palco.value?.requestFullscreen)
})

function telaCheia() {
  palco.value?.requestFullscreen?.().catch(() => {})
}

useHead(() => ({ title: jogo.value ? `${jogo.value.titulo} — Arcade Mundo Lúdico` : 'Jogo' }))
</script>

<template>
  <main class="envoltorio">
    <template v-if="jogo">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; flex-wrap:wrap; margin-bottom:14px">
        <div>
          <NuxtLink to="/" class="sobrenome" style="text-decoration:none">‹ Voltar à galeria</NuxtLink>
          <h1 style="margin-top:4px">{{ jogo.titulo }}</h1>
          <p style="color:var(--realce); font-weight:600">por {{ jogo.autor }}</p>
        </div>
        <button v-if="podeTelaCheia" type="button" class="btn" @click="telaCheia">Tela cheia</button>
      </div>

      <!-- Só aparece em aparelhos de toque (celular e tablet), pelo CSS. -->
      <p class="aviso-toque" role="note">
        <b>Atenção:</b> jogos que não foram feitos para celular podem não funcionar direito com o
        toque na tela. Nesses jogos, use as setas do teclado.
      </p>

      <p v-if="jogo.descricao" style="color:var(--tinta-suave); max-width:65ch; margin-bottom:16px">
        {{ jogo.descricao }}
      </p>

      <div ref="palco" class="palco" @click="focarJogo">
        <iframe
          v-if="src"
          ref="quadro"
          :src="src"
          :title="jogo.titulo"
          :style="{ aspectRatio: `${jogo.largura} / ${jogo.altura}` }"
          allow="autoplay; fullscreen; gamepad; clipboard-write"
          @load="focarJogo"
        />
      </div>

      <p class="dica-teclado">
        Se o teclado parar de responder, clique no jogo. Alguns jogos só ligam o som depois do primeiro clique.
      </p>

      <aside class="convite-jogo">
        <img src="/logo-128.png" alt="" width="64" height="64" loading="lazy">
        <div>
          <strong>{{ jogo.autor }} criou este jogo nas aulas da Escola Mundo Lúdico.</strong>
          <p>Seu filho também pode programar o próprio jogo. Agende uma aula experimental.</p>
        </div>
        <BotaoAgendar />
      </aside>
    </template>

    <div v-else class="vazio-estado">
      <p><strong>Jogo não encontrado.</strong></p>
      <p>Ele pode ter sido despublicado. <NuxtLink to="/">Voltar à galeria</NuxtLink>.</p>
    </div>
  </main>
</template>
