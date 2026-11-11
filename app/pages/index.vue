<script setup lang="ts">
import { agruparPorAluno, maisJogados, type JogoPublico } from '~/utils/jogoPublico'

type Visao = 'alunos' | 'mais-jogados'

const supabase = useSupabaseClient()
const busca = ref('')
const visao = ref<Visao>('alunos')
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
const autores = computed(() => new Set((jogos.value ?? []).map((j) => j.autor_id)).size)

// Com busca ativa (ou um aluno só), os grupos abrem sozinhos para o resultado aparecer.
const abrirTodos = computed(() => busca.value.trim() !== '' || grupos.value.length === 1)

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
  <main>
    <section class="abertura">
      <div class="envoltorio abertura-dentro">
        <div class="abertura-texto">
          <p class="sobrenome">Escola Mundo Lúdico · Franca - SP</p>
          <h1>Jogos de verdade, criados pelos nossos alunos</h1>
          <p>
            Cada jogo daqui foi programado por uma criança da Mundo Lúdico. Escolha um aluno,
            abra o jogo e jogue no navegador, sem instalar nada.
          </p>
          <div class="abertura-acoes">
            <BotaoAgendar tamanho="grande" />
            <a href="#onde-titulo" class="btn">Onde fica a escola</a>
          </div>
        </div>
      </div>
    </section>

    <div class="envoltorio">
      <div class="galeria-controles">
        <div class="chips" role="group" aria-label="Como ver os jogos">
          <button type="button" class="chip" :aria-pressed="visao === 'alunos'" @click="visao = 'alunos'">
            Por aluno
          </button>
          <button
            type="button" class="chip" :aria-pressed="visao === 'mais-jogados'"
            @click="visao = 'mais-jogados'"
          >
            Mais jogados
          </button>
        </div>
        <input
          v-model="busca" type="text" placeholder="Buscar por jogo ou aluno"
          aria-label="Buscar jogos" class="busca"
        >
        <span v-if="jogos?.length" class="etiqueta cinza">
          {{ jogos.length }} jogos · {{ autores }} {{ autores === 1 ? 'aluno' : 'alunos' }}
        </span>
      </div>

      <p v-if="pending" class="vazio-estado">Carregando a galeria…</p>

      <p v-else-if="falhaConexao" class="aviso erro">
        <b>Não foi possível carregar os jogos agora.</b> Tente de novo em alguns instantes.
      </p>

      <template v-else-if="filtrados.length">
        <div v-if="visao === 'alunos'" class="grupos">
          <details v-for="g in grupos" :key="g.autorId" class="grupo-aluno" :open="abrirTodos">
            <summary>
              <span class="avatar" aria-hidden="true">{{ g.autor.charAt(0) }}</span>
              <span class="grupo-nome">
                <strong>{{ g.autor }}</strong>
                <span>
                  {{ g.jogos.length }} {{ g.jogos.length === 1 ? 'jogo' : 'jogos' }} ·
                  {{ g.jogadas }} {{ g.jogadas === 1 ? 'jogada' : 'jogadas' }}
                </span>
              </span>
              <span class="seta" aria-hidden="true">▾</span>
            </summary>
            <div class="vitrine">
              <JogoCartao v-for="j in g.jogos" :key="j.id" :jogo="j" />
            </div>
          </details>
        </div>

        <div v-else class="vitrine">
          <JogoCartao v-for="(j, i) in ranking" :key="j.id" :jogo="j" :posicao="i + 1" mostrar-autor />
        </div>
      </template>

      <p v-else-if="busca" class="vazio-estado">Nenhum jogo ou aluno com “{{ busca }}”.</p>

      <div v-else class="vazio-estado">
        <p style="margin-bottom:6px"><strong>A galeria ainda está vazia.</strong></p>
        <p>Os primeiros jogos dos alunos aparecem aqui em breve.</p>
      </div>
    </div>
  </main>
</template>
