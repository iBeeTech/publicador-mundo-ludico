<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { formatarBytes } from '~/composables/useExportConstruct'

interface Aluno {
  id: string; nome_completo: string; nome_exibicao: string
  turma: string | null; autorizacao_responsavel: boolean
}
interface Jogo {
  id: string; aluno_id: string; titulo: string; pasta: string
  publicado: boolean; bytes: number; criado_em: string
  alunos: { nome_exibicao: string; autorizacao_responsavel: boolean } | null
}

const supabase = useSupabaseClient()
const aviso = ref('')

const { data: jogos, refresh } = await useAsyncData('admin-jogos', async () => {
  const { data, error } = await supabase
    .from('jogos')
    .select('id, aluno_id, titulo, pasta, publicado, bytes, criado_em, alunos(nome_exibicao, autorizacao_responsavel)')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Jogo[]
})

const { data: alunos } = await useAsyncData('admin-alunos-resumo', async () => {
  const { data, error } = await supabase.from('alunos').select('*').order('nome_exibicao')
  if (error) throw error
  return (data ?? []) as unknown as Aluno[]
})

const totalBytes = computed(() => (jogos.value ?? []).reduce((s, j) => s + Number(j.bytes || 0), 0))
const publicados = computed(() => (jogos.value ?? []).filter((j) => j.publicado).length)
const semAutorizacao = computed(() =>
  (jogos.value ?? []).filter((j) => j.publicado && j.alunos && !j.alunos.autorizacao_responsavel).length
)

async function alternar(j: Jogo) {
  const { error } = await supabase.from('jogos').update({ publicado: !j.publicado }).eq('id', j.id)
  if (error) { aviso.value = error.message; return }
  await refresh()
}

async function apagar(j: Jogo) {
  if (!confirm(`Apagar "${j.titulo}" e todos os arquivos dele? Isso não tem volta.`)) return
  const { data: arquivos } = await supabase.rpc('arquivos_do_jogo', { jogo: j.id })
  const caminhos = ((arquivos ?? []) as { path: string }[]).map((a) => a.path)
  if (caminhos.length) await supabase.storage.from('jogos').remove(caminhos)
  const { error } = await supabase.from('jogos').delete().eq('id', j.id)
  if (error) { aviso.value = error.message; return }
  aviso.value = `"${j.titulo}" foi apagado, com ${caminhos.length} arquivos.`
  await refresh()
}

useHead({ title: 'Painel — Arcade Mundo Lúdico' })
</script>

<template>
  <main class="envoltorio">
    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; flex-wrap:wrap; margin-bottom:20px">
      <div>
        <p class="sobrenome">Área do professor</p>
        <h1 style="margin-top:4px">Painel</h1>
      </div>
      <div class="acoes">
        <NuxtLink to="/admin/alunos" class="btn">Alunos</NuxtLink>
        <NuxtLink to="/admin/jogos/novo" class="btn principal">Publicar jogo</NuxtLink>
      </div>
    </div>

    <p v-if="aviso" class="aviso bom" style="margin-bottom:16px">{{ aviso }}</p>

    <p v-if="semAutorizacao" class="aviso erro" style="margin-bottom:16px">
      <b>{{ semAutorizacao }} jogo(s) marcado(s) como publicado(s)</b> pertencem a alunos sem
      autorização do responsável. Eles <b>não</b> aparecem na galeria pública — a trava é no banco.
      Registre a autorização na tela de alunos para liberá-los.
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:22px">
      <span class="etiqueta">{{ jogos?.length ?? 0 }} jogos</span>
      <span class="etiqueta verde">{{ publicados }} na galeria</span>
      <span class="etiqueta">{{ alunos?.length ?? 0 }} alunos</span>
      <span class="etiqueta">{{ formatarBytes(totalBytes) }} em arquivos</span>
    </div>

    <div class="painel">
      <h2>Jogos</h2>

      <div v-if="jogos?.length" class="rolagem">
        <table>
          <thead>
            <tr>
              <th>Jogo</th><th>Autor</th><th>Tamanho</th><th>Situação</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="j in jogos" :key="j.id">
              <td><strong>{{ j.titulo }}</strong></td>
              <td>{{ j.alunos?.nome_exibicao ?? '—' }}</td>
              <td>{{ formatarBytes(Number(j.bytes || 0)) }}</td>
              <td>
                <span v-if="!j.publicado" class="etiqueta cinza">rascunho</span>
                <span v-else-if="j.alunos && !j.alunos.autorizacao_responsavel" class="etiqueta vermelha">
                  retido: sem autorização
                </span>
                <span v-else class="etiqueta verde">na galeria</span>
              </td>
              <td>
                <div class="acoes">
                  <NuxtLink :to="`/jogo/${j.id}`" class="btn pequeno">Ver</NuxtLink>
                  <button type="button" class="btn pequeno" @click="alternar(j)">
                    {{ j.publicado ? 'Despublicar' : 'Publicar' }}
                  </button>
                  <button type="button" class="btn pequeno perigo" @click="apagar(j)">Apagar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="vazio-estado">
        Nenhum jogo ainda. Comece em <NuxtLink to="/admin/jogos/novo">Publicar jogo</NuxtLink>.
      </div>
    </div>
  </main>
</template>
