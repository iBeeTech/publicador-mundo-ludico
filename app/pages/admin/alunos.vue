<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Aluno {
  id: string
  nome_completo: string
  nome_exibicao: string
  turma: string | null
  autorizacao_responsavel: boolean
  observacoes: string | null
}

const supabase = useSupabaseClient()
const aviso = ref('')
const erro = ref('')

const novo = reactive({
  nome_completo: '', nome_exibicao: '', turma: '',
  autorizacao_responsavel: false, observacoes: ''
})

const { data: alunos, refresh } = await useAsyncData('alunos', async () => {
  const { data, error } = await supabase.from('alunos').select('*').order('nome_exibicao')
  if (error) throw error
  return (data ?? []) as unknown as Aluno[]
})

/** Sugere "Gabriel S." a partir do nome completo, que é o formato público. */
watch(() => novo.nome_completo, (v) => {
  const partes = v.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) { novo.nome_exibicao = ''; return }
  const primeiro = partes[0]!
  const ultimo = partes.length > 1 ? partes[partes.length - 1]! : ''
  novo.nome_exibicao = ultimo ? `${primeiro} ${ultimo[0]!.toUpperCase()}.` : primeiro
})

async function criar() {
  erro.value = ''
  if (!novo.nome_completo.trim() || !novo.nome_exibicao.trim()) {
    erro.value = 'Preencha o nome completo e o nome de exibição.'
    return
  }
  const { error } = await supabase.from('alunos').insert({
    nome_completo: novo.nome_completo.trim(),
    nome_exibicao: novo.nome_exibicao.trim(),
    turma: novo.turma.trim() || null,
    autorizacao_responsavel: novo.autorizacao_responsavel,
    observacoes: novo.observacoes.trim() || null
  })
  if (error) { erro.value = error.message; return }
  aviso.value = `${novo.nome_exibicao} foi cadastrado.`
  Object.assign(novo, { nome_completo: '', nome_exibicao: '', turma: '', autorizacao_responsavel: false, observacoes: '' })
  await refresh()
}

async function alternarAutorizacao(a: Aluno) {
  const { error } = await supabase
    .from('alunos')
    .update({ autorizacao_responsavel: !a.autorizacao_responsavel })
    .eq('id', a.id)
  if (error) { erro.value = error.message; return }
  await refresh()
}

async function apagar(a: Aluno) {
  if (!confirm(`Apagar ${a.nome_exibicao} e todos os jogos dele? Isso não tem volta.`)) return
  const { error } = await supabase.from('alunos').delete().eq('id', a.id)
  if (error) { erro.value = error.message; return }
  aviso.value = `${a.nome_exibicao} foi removido.`
  await refresh()
}

useHead({ title: 'Alunos — Arcade Mundo Lúdico' })
</script>

<template>
  <main class="envoltorio">
    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; flex-wrap:wrap; margin-bottom:20px">
      <div>
        <p class="sobrenome">Área do professor</p>
        <h1 style="margin-top:4px">Alunos</h1>
      </div>
      <NuxtLink to="/admin" class="btn">Voltar ao painel</NuxtLink>
    </div>

    <p v-if="aviso" class="aviso bom" style="margin-bottom:16px">{{ aviso }}</p>

    <div class="painel" style="margin-bottom:24px">
      <h2>Cadastrar aluno</h2>

      <form style="display:grid; gap:16px" @submit.prevent="criar">
        <div class="linha-campos">
          <div class="campo">
            <label for="nc">Nome completo</label>
            <input id="nc" v-model="novo.nome_completo" type="text" required>
            <span class="ajuda">Fica só no painel. Nunca aparece na galeria.</span>
          </div>
          <div class="campo">
            <label for="ne">Nome de exibição</label>
            <input id="ne" v-model="novo.nome_exibicao" type="text" required>
            <span class="ajuda">É isso que o público vê. Sugerido automaticamente.</span>
          </div>
          <div class="campo">
            <label for="tu">Turma</label>
            <input id="tu" v-model="novo.turma" type="text" placeholder="4º ano B">
          </div>
        </div>

        <label class="caixa-check" for="aut">
          <input id="aut" v-model="novo.autorizacao_responsavel" type="checkbox">
          <span class="txt">
            <b>O responsável autorizou a publicação</b>
            Sem esta marca, os jogos deste aluno ficam retidos e não aparecem na galeria pública,
            mesmo se forem marcados como publicados. Guarde o termo assinado em arquivo.
          </span>
        </label>

        <div class="campo">
          <label for="ob">Observações</label>
          <textarea id="ob" v-model="novo.observacoes" placeholder="Ex.: termo assinado em 03/03, arquivado na secretaria." />
        </div>

        <p v-if="erro" class="aviso erro">{{ erro }}</p>
        <div><button class="btn principal" type="submit">Cadastrar aluno</button></div>
      </form>
    </div>

    <div class="painel">
      <h2>Cadastrados</h2>

      <div v-if="alunos?.length" class="rolagem">
        <table>
          <thead>
            <tr><th>Exibição</th><th>Nome completo</th><th>Turma</th><th>Autorização</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in alunos" :key="a.id">
              <td><strong>{{ a.nome_exibicao }}</strong></td>
              <td style="color:var(--tinta-suave)">{{ a.nome_completo }}</td>
              <td>{{ a.turma ?? '—' }}</td>
              <td>
                <span v-if="a.autorizacao_responsavel" class="etiqueta verde">autorizado</span>
                <span v-else class="etiqueta vermelha">pendente</span>
              </td>
              <td>
                <div class="acoes">
                  <button type="button" class="btn pequeno" @click="alternarAutorizacao(a)">
                    {{ a.autorizacao_responsavel ? 'Revogar' : 'Autorizar' }}
                  </button>
                  <button type="button" class="btn pequeno perigo" @click="apagar(a)">Apagar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="vazio-estado">Nenhum aluno cadastrado ainda.</div>
    </div>
  </main>
</template>
