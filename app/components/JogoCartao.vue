<script setup lang="ts">
import type { JogoPublico } from '~/utils/jogoPublico'

defineProps<{ jogo: JogoPublico; posicao?: number; mostrarAutor?: boolean }>()
const urlDe = useStorageUrl()
</script>

<template>
  <NuxtLink :to="`/jogo/${jogo.id}`" class="jogo-cartao">
    <div class="capa">
      <img v-if="jogo.capa_path" :src="urlDe(jogo.capa_path)!" :alt="`Cena do jogo ${jogo.titulo}`" loading="lazy">
      <img v-else src="/logo-128.png" alt="" class="sem-capa" loading="lazy">
      <span v-if="posicao" class="medalha" :class="`lugar-${posicao}`">{{ posicao }}º</span>
    </div>
    <div class="corpo">
      <h3>{{ jogo.titulo }}</h3>
      <span v-if="mostrarAutor" class="autor">por {{ jogo.autor }}</span>
      <span class="jogar" aria-hidden="true">▶ Jogar</span>
    </div>
  </NuxtLink>
</template>
