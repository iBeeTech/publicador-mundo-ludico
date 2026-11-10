<script setup lang="ts">
interface JogoPublico {
  id: string
  titulo: string
  descricao: string | null
  pasta: string
  capa_path: string | null
  largura: number
  altura: number
  criado_em: string
  autor: string
}

const supabase = useSupabaseClient()
const urlDe = useStorageUrl()
const busca = ref('')

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
  if (!t) return jogos.value ?? []
  return (jogos.value ?? []).filter(
    (j) => j.titulo.toLowerCase().includes(t) || j.autor.toLowerCase().includes(t)
  )
})

const autores = computed(() => new Set((jogos.value ?? []).map((j) => j.autor)).size)

useHead({ title: 'Arcade Mundo Lúdico — jogos feitos pelos alunos' })
</script>

<template>
  <main class="envoltorio">
    <section style="display:grid; gap:10px; max-width:62ch; margin-bottom:22px">
      <p class="sobrenome">Escola Mundo Lúdico</p>
      <h1>Os jogos da turma, para jogar agora</h1>
      <p style="color:var(--tinta-suave)">
        Cada jogo aqui foi construído por um aluno no Construct 3, do primeiro evento ao último.
        Clique em qualquer um para jogar no navegador, sem instalar nada.
      </p>
    </section>

    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:20px">
      <input
        v-model="busca"
        type="text"
        placeholder="Buscar por jogo ou autor"
        style="max-width:300px"
        aria-label="Buscar jogos"
      >
      <span v-if="jogos?.length" class="etiqueta cinza">
        {{ jogos.length }} jogos · {{ autores }} criadores
      </span>
    </div>

    <p v-if="pending" class="vazio-estado">Carregando a galeria…</p>

    <p v-else-if="falhaConexao" class="aviso erro">
      <b>Não consegui falar com o banco.</b>
      Confira o <code>.env</code> (SUPABASE_URL e SUPABASE_KEY) e se o schema.sql já foi rodado.
    </p>

    <div v-else-if="filtrados.length" class="vitrine">
      <NuxtLink v-for="j in filtrados" :key="j.id" :to="`/jogo/${j.id}`" class="jogo-cartao">
        <div class="capa">
          <img v-if="j.capa_path" :src="urlDe(j.capa_path)!" :alt="''" loading="lazy">
          <span v-else class="vazia">▶</span>
        </div>
        <div class="corpo">
          <h3>{{ j.titulo }}</h3>
          <span class="autor">{{ j.autor }}</span>
          <p v-if="j.descricao" class="resumo">{{ j.descricao }}</p>
        </div>
      </NuxtLink>
    </div>

    <p v-else-if="busca" class="vazio-estado">
      Nenhum jogo com “{{ busca }}”.
    </p>

    <div v-else class="vazio-estado">
      <p style="margin-bottom:6px"><strong>A galeria ainda está vazia.</strong></p>
      <p>Assim que o primeiro jogo for publicado pelo painel do professor, ele aparece aqui.</p>
    </div>
  </main>
</template>
