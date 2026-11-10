<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const urlDe = useStorageUrl()

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

const src = computed(() => (jogo.value ? urlDe(jogo.value.pasta + 'index.html') : null))
const palco = ref<HTMLElement | null>(null)

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
        <button type="button" class="btn" @click="telaCheia">Tela cheia</button>
      </div>

      <p v-if="jogo.descricao" style="color:var(--tinta-suave); max-width:65ch; margin-bottom:16px">
        {{ jogo.descricao }}
      </p>

      <div ref="palco" class="palco">
        <iframe
          v-if="src"
          :src="src"
          :title="jogo.titulo"
          :style="{ aspectRatio: `${jogo.largura} / ${jogo.altura}` }"
          allow="autoplay; fullscreen; gamepad; clipboard-write"
          allowfullscreen
        />
      </div>

      <p style="color:var(--tinta-suave); font-size:13px; margin-top:12px">
        Clique dentro do jogo antes de usar o teclado. Alguns jogos só ligam o som depois do primeiro clique.
      </p>
    </template>

    <div v-else class="vazio-estado">
      <p><strong>Jogo não encontrado.</strong></p>
      <p>Ele pode ter sido despublicado. <NuxtLink to="/">Voltar à galeria</NuxtLink>.</p>
    </div>
  </main>
</template>
