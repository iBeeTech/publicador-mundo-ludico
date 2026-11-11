<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { formatarBytes } from '~/composables/useExportConstruct'

interface Aluno {
  id: string; nome_completo: string; nome_exibicao: string
  turma: string | null; autorizacao_responsavel: boolean
}
interface Jogo {
  id: string; aluno_id: string; titulo: string; pasta: string
  publicado: boolean; bytes: number; jogadas: number; criado_em: string
  alunos: { nome_exibicao: string; autorizacao_responsavel: boolean } | null
}
type Modo = 'aluno' | 'mais-jogados'
type Linha =
  | { tipo: 'grupo'; chave: string; nome: string; total: number; jogadas: number }
  | { tipo: 'jogo'; chave: string; jogo: Jogo; posicao: number | null }

const supabase = useSupabaseClient()
const aviso = ref('')

const { data: jogos, refresh } = await useAsyncData('admin-jogos', async () => {
  const { data, error } = await supabase
    .from('jogos')
    .select('id, aluno_id, titulo, pasta, publicado, bytes, jogadas, criado_em, alunos(nome_exibicao, autorizacao_responsavel)')
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

const modo = ref<Modo>('aluno')
const jogadasDe = (j: Jogo) => Number(j.jogadas || 0)
const nomeDoAutor = (j: Jogo) => j.alunos?.nome_exibicao ?? 'Sem aluno'

/** Uma linha de título por aluno, seguida dos jogos dele (mais recentes primeiro). */
function linhasPorAluno(lista: Jogo[]): Linha[] {
  const grupos = new Map<string, Jogo[]>()
  for (const j of lista) grupos.set(j.aluno_id, [...(grupos.get(j.aluno_id) ?? []), j])
  return [...grupos.entries()]
    .sort(([, a], [, b]) => nomeDoAutor(a[0]!).localeCompare(nomeDoAutor(b[0]!), 'pt-BR'))
    .flatMap(([alunoId, doAluno]) => [
      {
        tipo: 'grupo' as const, chave: `grupo-${alunoId}`, nome: nomeDoAutor(doAluno[0]!),
        total: doAluno.length, jogadas: doAluno.reduce((s, j) => s + jogadasDe(j), 0)
      },
      ...doAluno.map((jogo) => ({ tipo: 'jogo' as const, chave: jogo.id, jogo, posicao: null }))
    ])
}

/** Ranking único, do mais jogado para o menos jogado. */
function linhasMaisJogados(lista: Jogo[]): Linha[] {
  return [...lista]
    .sort((a, b) => jogadasDe(b) - jogadasDe(a) || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .map((jogo, i) => ({ tipo: 'jogo' as const, chave: jogo.id, jogo, posicao: i + 1 }))
}

const linhas = computed<Linha[]>(() => {
  const lista = jogos.value ?? []
  return modo.value === 'aluno' ? linhasPorAluno(lista) : linhasMaisJogados(lista)
})

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
      <div class="painel-topo">
        <h2>Jogos</h2>
        <div class="chips" role="group" aria-label="Como mostrar os jogos">
          <button type="button" class="chip" :aria-pressed="modo === 'aluno'" @click="modo = 'aluno'">
            Por aluno
          </button>
          <button
            type="button" class="chip" :aria-pressed="modo === 'mais-jogados'"
            @click="modo = 'mais-jogados'"
          >
            Mais jogados
          </button>
        </div>
      </div>

      <div v-if="jogos?.length" class="rolagem">
        <table>
          <thead>
            <tr>
              <th>Jogo</th><th>Autor</th><th class="numero">Jogadas</th><th>Tamanho</th><th>Situação</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="l in linhas" :key="l.chave">
              <tr v-if="l.tipo === 'grupo'" class="linha-grupo">
                <th colspan="6" scope="rowgroup">
                  {{ l.nome }}
                  <span>{{ l.total }} {{ l.total === 1 ? 'jogo' : 'jogos' }} · {{ l.jogadas }} jogadas</span>
                </th>
              </tr>
              <tr v-else>
                <td>
                  <span v-if="l.posicao" class="posicao">{{ l.posicao }}º</span>
                  <strong>{{ l.jogo.titulo }}</strong>
                </td>
                <td>{{ l.jogo.alunos?.nome_exibicao ?? '—' }}</td>
                <td class="numero">{{ jogadasDe(l.jogo) }}</td>
                <td>{{ formatarBytes(Number(l.jogo.bytes || 0)) }}</td>
                <td>
                  <span v-if="!l.jogo.publicado" class="etiqueta cinza">rascunho</span>
                  <span v-else-if="l.jogo.alunos && !l.jogo.alunos.autorizacao_responsavel" class="etiqueta vermelha">
                    retido: sem autorização
                  </span>
                  <span v-else class="etiqueta verde">na galeria</span>
                </td>
                <td>
                  <div class="acoes">
                    <NuxtLink :to="`/jogo/${l.jogo.id}`" class="btn pequeno">Ver</NuxtLink>
                    <button type="button" class="btn pequeno" @click="alternar(l.jogo)">
                      {{ l.jogo.publicado ? 'Despublicar' : 'Publicar' }}
                    </button>
                    <button type="button" class="btn pequeno perigo" @click="apagar(l.jogo)">Apagar</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-else class="vazio-estado">
        Nenhum jogo ainda. Comece em <NuxtLink to="/admin/jogos/novo">Publicar jogo</NuxtLink>.
      </div>
    </div>
  </main>
</template>
