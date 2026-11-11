<script setup lang="ts">
// O rodapé de divulgação da escola aparece em todo o site, menos na área do professor.
const route = useRoute()
const publico = computed(() => !route.path.startsWith('/admin'))
</script>

<template>
  <!-- .pagina ocupa a tela toda: o rodapé fica sempre colado embaixo. -->
  <div class="pagina">
    <SiteTopo />
    <NuxtPage />
    <EscolaRodape v-if="publico" />
  </div>
</template>
