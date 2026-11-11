<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

const noAdmin = computed(() => route.path.startsWith('/admin'))
// O CTA de matrícula some só para o professor logado trabalhando no painel.
const mostrarAgendar = computed(() => !(user.value && noAdmin.value))

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
        <!-- Navegação: sempre um caminho de volta para o "outro lado" do site. -->
        <div class="nav-links">
          <NuxtLink v-if="noAdmin" to="/" class="btn pequeno">Ver a galeria</NuxtLink>
          <NuxtLink v-else-if="user" to="/admin" class="btn pequeno">Painel</NuxtLink>
          <NuxtLink v-else to="/admin/login" class="btn pequeno">Área do professor</NuxtLink>

          <template v-if="user && noAdmin">
            <NuxtLink to="/admin/jogos/novo" class="btn pequeno principal">Publicar jogo</NuxtLink>
            <button type="button" class="btn pequeno" @click="sair">Sair</button>
          </template>
        </div>

        <template v-if="mostrarAgendar">
          <span class="nav-separador" aria-hidden="true" />
          <a
            :href="WHATSAPP_LINK" target="_blank" rel="noopener noreferrer"
            class="btn agendar nav-agendar"
          >
            Agendar aula
          </a>
        </template>
      </nav>
    </div>
  </header>
</template>
