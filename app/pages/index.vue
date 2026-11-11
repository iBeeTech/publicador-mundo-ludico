<script setup lang="ts">
import { agruparPorAluno, maisJogados, type JogoPublico } from '~/utils/jogoPublico'

type Visao = 'mais-jogados' | 'alunos'

const supabase = useSupabaseClient()
const busca = ref('')
const visao = ref<Visao>('mais-jogados')
const falhaConexao = ref(false)

const { data: jogos, pending } = await useAsyncData('galeria', async () => {
  try {
    const { data, error } = await supabase
      .from('vw_jogos_publicos')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) throw error
    falhaConexao.value = false
    return (data ?? []) as unknown as JogoPublico[]
  } catch {
    // A galeria é a porta de entrada do site: ela nunca deve virar tela de erro.
    falhaConexao.value = true
    return [] as JogoPublico[]
  }
})

const filtrados = computed(() => {
  const t = busca.value.trim().toLowerCase()
  const todos = jogos.value ?? []
  if (!t) return todos
  return todos.filter((j) => j.titulo.toLowerCase().includes(t) || j.autor.toLowerCase().includes(t))
})

const grupos = computed(() => agruparPorAluno(filtrados.value))
const ranking = computed(() => maisJogados(filtrados.value))
const totalAlunos = computed(() => new Set((jogos.value ?? []).map((j) => j.autor_id)).size)

// Alunos começam fechados; só abrem sozinhos quando há uma busca.
const abrirGrupos = computed(() => busca.value.trim() !== '')

useHead({
  title: 'Arcade Mundo Lúdico — jogos feitos pelos alunos',
  meta: [
    {
      name: 'description',
      content:
        'Jogue os jogos criados pelos alunos da Escola Mundo Lúdico, em Franca - SP. Agende uma aula pelo WhatsApp.'
    }
  ]
})
</script>

<template>
  <main class="galeria">
    <section class="boas-vindas envoltorio">
      <h1>Escolha um jogo e <span class="destaque">divirta-se!</span></h1>
      <p>Todos os jogos foram criados pelos alunos da Escola Mundo Lúdico. É só clicar em <b>Jogar</b>.</p>
    </section>

    <div class="envoltorio">
      <div class="abas-linha">
        <div class="abas" role="tablist" aria-label="Como ver os jogos">
          <button
            type="button" role="tab" class="aba" :aria-selected="visao === 'mais-jogados'"
            @click="visao = 'mais-jogados'"
          >
            <svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg> Mais jogados
          </button>
          <button
            type="button" role="tab" class="aba" :aria-selected="visao === 'alunos'"
            @click="visao = 'alunos'"
          >
            <svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7.5 0a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM1.5 20c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5v1h-15v-1Zm15.5 1v-1c0-1.9-.7-3.6-1.9-4.9a6.4 6.4 0 0 1 1.4-.1c3.4 0 6 2.3 6 5v1H17Z"/></svg> Por aluno
            <span v-if="totalAlunos" class="aba-contador">{{ totalAlunos }}</span>
          </button>
        </div>
        <input
          v-model="busca" type="search" placeholder="Procurar jogo ou aluno"
          aria-label="Procurar jogo ou aluno" class="busca"
        >
      </div>

      <p v-if="pending" class="vazio-estado">Carregando os jogos…</p>

      <p v-else-if="falhaConexao" class="aviso erro">
        <b>Não foi possível carregar os jogos agora.</b> Tente de novo em alguns instantes.
      </p>

      <template v-else-if="filtrados.length">
        <div v-if="visao === 'mais-jogados'" class="vitrine">
          <JogoCartao v-for="(j, i) in ranking" :key="j.id" :jogo="j" :posicao="i + 1" mostrar-autor />
        </div>

        <div v-else class="grupos">
          <details v-for="g in grupos" :key="g.autorId" class="grupo-aluno" :open="abrirGrupos">
            <summary>
              <span class="avatar" aria-hidden="true">{{ g.autor.charAt(0) }}</span>
              <span class="grupo-nome">
                <strong>{{ g.autor }}</strong>
                <span>{{ g.jogos.length }} {{ g.jogos.length === 1 ? 'jogo' : 'jogos' }}</span>
              </span>
              <span class="ver-jogos">Ver jogos <span class="seta" aria-hidden="true">▾</span></span>
            </summary>
            <div class="vitrine">
              <JogoCartao v-for="j in g.jogos" :key="j.id" :jogo="j" />
            </div>
          </details>
        </div>
      </template>

      <p v-else-if="busca" class="vazio-estado">Nenhum jogo ou aluno com “{{ busca }}”.</p>

      <div v-else class="vazio-estado">
        <p style="margin-bottom:6px"><strong>Ainda não tem jogos aqui.</strong></p>
        <p>Os primeiros jogos dos alunos aparecem em breve.</p>
      </div>
    </div>
  </main>
</template>
