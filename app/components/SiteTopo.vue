<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

const noAdmin = computed(() => route.path.startsWith('/admin'))

async function sair() {
  await supabase.auth.signOut()
  await navigateTo('/')
}
</script>

<template>
  <header class="topo">
    <div class="dentro">
      <NuxtLink to="/" class="marca">
        <span class="selo" aria-hidden="true" />
        <span>
          <strong>Arcade Mundo Lúdico</strong>
          <span>Jogos feitos pelos alunos</span>
        </span>
      </NuxtLink>

      <nav class="navegacao">
        <NuxtLink v-if="noAdmin" to="/" class="btn pequeno">Ver a galeria</NuxtLink>
        <template v-if="user">
          <NuxtLink v-if="!noAdmin" to="/admin" class="btn pequeno">Painel</NuxtLink>
          <NuxtLink to="/admin/jogos/novo" class="btn pequeno principal">Publicar jogo</NuxtLink>
          <button type="button" class="btn pequeno" @click="sair">Sair</button>
        </template>
        <NuxtLink v-else to="/admin/login" class="btn pequeno">Área do professor</NuxtLink>
      </nav>
    </div>
  </header>
</template>
