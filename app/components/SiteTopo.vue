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
        <img src="/logo-128.png" alt="" width="44" height="44" class="selo">
        <span>
          <strong>Arcade Mundo Lúdico</strong>
          <span>Jogos feitos pelos alunos da escola</span>
        </span>
      </NuxtLink>

      <nav class="navegacao" aria-label="Principal">
        <NuxtLink v-if="noAdmin" to="/" class="btn pequeno">Ver a galeria</NuxtLink>
        <template v-if="user">
          <NuxtLink v-if="!noAdmin" to="/admin" class="btn pequeno">Painel</NuxtLink>
          <NuxtLink to="/admin/jogos/novo" class="btn pequeno principal">Publicar jogo</NuxtLink>
          <button type="button" class="btn pequeno" @click="sair">Sair</button>
        </template>
        <template v-else>
          <a
            :href="WHATSAPP_LINK" target="_blank" rel="noopener noreferrer"
            class="btn pequeno principal"
          >
            Agendar aula
          </a>
          <NuxtLink to="/admin/login" class="btn pequeno">Área do professor</NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>
