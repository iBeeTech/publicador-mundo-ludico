<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const TAMANHO_MINIMO = TAMANHO_MINIMO_SENHA

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const senha = ref('')
const confirmacao = ref('')
const erro = ref('')
const enviando = ref(false)

function validar(): string {
  if (senha.value.length < TAMANHO_MINIMO) {
    return `A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`
  }
  if (senha.value !== confirmacao.value) {
    return 'As duas senhas não são iguais.'
  }
  return ''
}

function traduzirErro(codigo: string | undefined, mensagem: string): string {
  if (codigo === 'same_password') return 'A senha nova precisa ser diferente da atual.'
  if (codigo === 'weak_password') return 'Essa senha é fraca demais. Tente outra mais longa.'
  return mensagem
}

async function salvar() {
  erro.value = validar()
  if (erro.value) return

  enviando.value = true
  const { error } = await supabase.auth.updateUser({
    password: senha.value,
    data: { [PRECISA_TROCAR_SENHA]: false }
  })
  enviando.value = false

  if (error) {
    erro.value = traduzirErro(error.code, error.message)
    return
  }
  // Renova a sessão e atualiza o usuário na hora, para o middleware já
  // enxergar a marca removida e não devolver o professor para esta tela.
  await supabase.auth.refreshSession()
  const { data } = await supabase.auth.getClaims()
  user.value = data?.claims ?? null
  await navigateTo((route.query.voltar as string) || '/admin')
}

useHead({ title: 'Nova senha — Arcade Mundo Lúdico' })
</script>

<template>
  <main class="envoltorio" style="max-width:420px">
    <div class="painel" style="margin-top:40px">
      <div>
        <p class="sobrenome">Primeiro acesso</p>
        <h2 style="margin-top:4px">Crie sua senha</h2>
      </div>

      <p style="font-size:14px; color:var(--tinta-suave)">
        Você entrou com uma senha provisória. Antes de usar o painel, escolha uma
        senha nova com pelo menos {{ TAMANHO_MINIMO }} caracteres.
      </p>

      <form style="display:grid; gap:14px" @submit.prevent="salvar">
        <div class="campo">
          <label for="senha">Senha nova</label>
          <input
            id="senha" v-model="senha" type="password" required
            :minlength="TAMANHO_MINIMO" autocomplete="new-password"
          >
        </div>
        <div class="campo">
          <label for="confirmacao">Repita a senha nova</label>
          <input
            id="confirmacao" v-model="confirmacao" type="password" required
            :minlength="TAMANHO_MINIMO" autocomplete="new-password"
          >
        </div>
        <p v-if="erro" class="aviso erro">{{ erro }}</p>
        <button class="btn principal" type="submit" :disabled="enviando">
          {{ enviando ? 'Salvando…' : 'Salvar e entrar' }}
        </button>
      </form>
    </div>
  </main>
</template>
