<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { lerExport, enviarExport, formatarBytes, type ExportLido } from '~/composables/useExportConstruct'

interface Aluno { id: string; nome_exibicao: string; turma: string | null; autorizacao_responsavel: boolean }

const LIMITE_MB = 60

const supabase = useSupabaseClient()
const erro = ref('')
const lendo = ref(false)
const enviando = ref(false)
const feito = ref<{ id: string; titulo: string } | null>(null)
const progresso = reactive({ feitos: 0, total: 0 })

const arquivoZip = ref<File | null>(null)
const lido = ref<ExportLido | null>(null)

const form = reactive({
  aluno_id: '', titulo: '', descricao: '', publicar: true,
  largura: 800, altura: 600
})

const { data: alunos } = await useAsyncData('alunos-para-upload', async () => {
  const { data, error } = await supabase
    .from('alunos').select('id, nome_exibicao, turma, autorizacao_responsavel').order('nome_exibicao')
  if (error) throw error
  return (data ?? []) as unknown as Aluno[]
})

const alunoEscolhido = computed(() => (alunos.value ?? []).find((a) => a.id === form.aluno_id) ?? null)
const pct = computed(() => (progresso.total ? Math.round((progresso.feitos / progresso.total) * 100) : 0))

async function aoEscolherArquivo(ev: Event) {
  erro.value = ''
  lido.value = null
  const file = (ev.target as HTMLInputElement).files?.[0] ?? null
  arquivoZip.value = file
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.zip')) {
    erro.value = 'Envie o ZIP da pasta exportada. O Construct 3 já entrega um .zip em Export » Web (HTML5).'
    return
  }
  if (file.size > LIMITE_MB * 1024 * 1024) {
    erro.value = `O arquivo tem ${formatarBytes(file.size)}. O limite aqui é ${LIMITE_MB} MB — normalmente o que pesa é áudio em WAV. Exporte os sons em MP3 ou OGG.`
    return
  }

  lendo.value = true
  try {
    const r = await lerExport(file)
    lido.value = r
    form.largura = r.largura
    form.altura = r.altura
    if (!form.titulo) form.titulo = file.name.replace(/\.zip$/i, '').replace(/[-_]+/g, ' ')
  } catch (e) {
    erro.value = (e as Error).message
  } finally {
    lendo.value = false
  }
}

async function publicar() {
  erro.value = ''
  if (!form.aluno_id) { erro.value = 'Escolha de quem é o jogo.'; return }
  if (!form.titulo.trim()) { erro.value = 'Dê um nome ao jogo.'; return }
  if (!lido.value) { erro.value = 'Escolha o ZIP do export.'; return }

  enviando.value = true
  progresso.feitos = 0
  progresso.total = lido.value.arquivos.length

  // 1. Cria o registro para ter o id, que vira o nome da pasta no Storage.
  const { data: criado, error: e1 } = await supabase
    .from('jogos')
    .insert({
      aluno_id: form.aluno_id,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      pasta: 'pendente/',
      largura: form.largura,
      altura: form.altura,
      publicado: false,
      bytes: lido.value.bytes
    })
    .select('id')
    .single()

  if (e1 || !criado) { enviando.value = false; erro.value = e1?.message ?? 'Falha ao criar o jogo.'; return }

  const id = (criado as { id: string }).id
  const pasta = `${id}/`

  // 2. Sobe os arquivos mantendo a estrutura de pastas do export.
  try {
    await enviarExport(
      supabase.storage.from('jogos'),
      pasta,
      lido.value.arquivos,
      (f, t) => { progresso.feitos = f; progresso.total = t }
    )
  } catch (e) {
    await supabase.from('jogos').delete().eq('id', id)
    enviando.value = false
    erro.value = (e as Error).message + ' O registro foi desfeito; pode tentar de novo.'
    return
  }

  // 3. Só agora grava a pasta e o estado de publicação.
  const { error: e2 } = await supabase
    .from('jogos')
    .update({
      pasta,
      capa_path: lido.value.capa ? pasta + lido.value.capa : null,
      publicado: form.publicar
    })
    .eq('id', id)

  enviando.value = false
  if (e2) { erro.value = e2.message; return }
  feito.value = { id, titulo: form.titulo.trim() }
}

function recomecar() {
  feito.value = null
  lido.value = null
  arquivoZip.value = null
  Object.assign(form, { aluno_id: '', titulo: '', descricao: '', publicar: true, largura: 800, altura: 600 })
}

useHead({ title: 'Publicar jogo — Arcade Mundo Lúdico' })
</script>

<template>
  <main class="envoltorio" style="max-width:760px">
    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; flex-wrap:wrap; margin-bottom:20px">
      <div>
        <p class="sobrenome">Área do professor</p>
        <h1 style="margin-top:4px">Publicar jogo</h1>
      </div>
      <NuxtLink to="/admin" class="btn">Voltar ao painel</NuxtLink>
    </div>

    <!-- ---------- sucesso ---------- -->
    <div v-if="feito" class="painel">
      <p class="aviso bom">
        <b>{{ feito.titulo }}</b> foi enviado com sucesso.
      </p>
      <div class="acoes">
        <NuxtLink :to="`/jogo/${feito.id}`" class="btn principal">Jogar agora</NuxtLink>
        <button type="button" class="btn" @click="recomecar">Publicar outro</button>
        <NuxtLink to="/admin" class="btn">Ir ao painel</NuxtLink>
      </div>
    </div>

    <!-- ---------- formulário ---------- -->
    <form v-else class="painel" @submit.prevent="publicar">
      <div class="campo">
        <label for="zip">ZIP do export do Construct 3</label>
        <input id="zip" type="file" accept=".zip" @change="aoEscolherArquivo">
        <span class="ajuda">
          No Construct: <b>Menu » Project » Export » Web (HTML5)</b>. Envie o .zip inteiro,
          não só o index.html e não o arquivo .c3p do projeto.
        </span>
      </div>

      <p v-if="lendo" class="aviso">Lendo o ZIP…</p>

      <div v-if="lido" class="aviso bom">
        <b>Export reconhecido.</b>
        {{ lido.arquivos.length }} arquivos, {{ formatarBytes(lido.bytes) }},
        tela {{ lido.largura }}×{{ lido.altura }}.
        <span v-if="lido.capa"> Capa encontrada no próprio export.</span>
      </div>

      <div v-if="lido" class="lista-arquivos">
        <span v-for="a in lido.arquivos.slice(0, 8)" :key="a.caminho">{{ a.caminho }}</span>
        <span v-if="lido.arquivos.length > 8">… e mais {{ lido.arquivos.length - 8 }} arquivos</span>
      </div>

      <div class="linha-campos">
        <div class="campo">
          <label for="al">De quem é o jogo</label>
          <select id="al" v-model="form.aluno_id" required>
            <option value="">Escolha o aluno</option>
            <option v-for="a in alunos" :key="a.id" :value="a.id">
              {{ a.nome_exibicao }}<template v-if="a.turma"> — {{ a.turma }}</template>
            </option>
          </select>
          <span v-if="!alunos?.length" class="ajuda">
            Nenhum aluno cadastrado. <NuxtLink to="/admin/alunos">Cadastre um primeiro.</NuxtLink>
          </span>
        </div>
        <div class="campo">
          <label for="ti">Nome do jogo</label>
          <input id="ti" v-model="form.titulo" type="text" required>
        </div>
      </div>

      <p v-if="alunoEscolhido && !alunoEscolhido.autorizacao_responsavel" class="aviso erro">
        <b>{{ alunoEscolhido.nome_exibicao }} está sem autorização do responsável.</b>
        Você pode enviar o jogo, mas ele ficará retido: não aparece na galeria pública até a
        autorização ser registrada na tela de alunos.
      </p>

      <div class="campo">
        <label for="de">Descrição</label>
        <textarea id="de" v-model="form.descricao" placeholder="Em duas linhas: do que trata o jogo e como se joga." />
      </div>

      <div class="linha-campos">
        <div class="campo">
          <label for="lg">Largura da tela</label>
          <input id="lg" v-model.number="form.largura" type="number" min="200" max="2000">
        </div>
        <div class="campo">
          <label for="at">Altura da tela</label>
          <input id="at" v-model.number="form.altura" type="number" min="200" max="2000">
          <span class="ajuda">Lido do export. Ajuste se o jogo aparecer cortado.</span>
        </div>
      </div>

      <label class="caixa-check" for="pb">
        <input id="pb" v-model="form.publicar" type="checkbox">
        <span class="txt">
          <b>Publicar na galeria assim que terminar o envio</b>
          Desmarque para deixar como rascunho e revisar antes.
        </span>
      </label>

      <p v-if="erro" class="aviso erro">{{ erro }}</p>

      <div v-if="enviando" style="display:grid; gap:7px">
        <div class="progresso"><div :style="{ width: pct + '%' }" /></div>
        <span style="font-size:13px; color:var(--tinta-suave)">
          Enviando {{ progresso.feitos }} de {{ progresso.total }} arquivos ({{ pct }}%)
        </span>
      </div>

      <div>
        <button class="btn principal" type="submit" :disabled="enviando || !lido">
          {{ enviando ? 'Enviando…' : 'Enviar e publicar' }}
        </button>
      </div>
    </form>
  </main>
</template>
