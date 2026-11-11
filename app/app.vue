<script setup lang="ts">
// O rodapé de divulgação da escola aparece em todo o site, menos na área do professor.
const route = useRoute()
const publico = computed(() => !route.path.startsWith('/admin'))
</script>

<template>
  <div>
    <SiteTopo />
    <NuxtPage />
    <EscolaRodape v-if="publico" />
  </div>
</template>
