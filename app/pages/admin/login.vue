<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)

watchEffect(() => {
  if (user.value) navigateTo((route.query.voltar as string) || '/admin')
})

async function entrar() {
  erro.value = ''
  enviando.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: senha.value
  })
  enviando.value = false
  if (error) {
    erro.value = error.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos.'
      : error.message
  }
}

useHead({ title: 'Entrar — Arcade Mundo Lúdico' })
</script>

<template>
  <main class="envoltorio" style="max-width:420px">
    <div class="painel" style="margin-top:40px">
      <img src="/logo-128.png" alt="Escola Mundo Lúdico" width="88" height="88" style="border-radius:50%">
      <div>
        <p class="sobrenome">Área do professor</p>
        <h2 style="margin-top:4px">Entrar no painel</h2>
      </div>

      <form style="display:grid; gap:14px" @submit.prevent="entrar">
        <div class="campo">
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" required autocomplete="email">
        </div>
        <div class="campo">
          <label for="senha">Senha</label>
          <input id="senha" v-model="senha" type="password" required autocomplete="current-password">
        </div>
        <p v-if="erro" class="aviso erro">{{ erro }}</p>
        <button class="btn principal" type="submit" :disabled="enviando">
          {{ enviando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p style="font-size:13px; color:var(--tinta-suave)">
        As contas de professor são criadas pelo painel do Supabase, em
        <b>Authentication » Users</b>. Não existe cadastro aberto nesta tela de propósito.
      </p>
    </div>
  </main>
</template>
