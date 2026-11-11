/** Uma linha da view vw_jogos_publicos (o que a galeria pública enxerga). */
export interface JogoPublico {
  id: string
  titulo: string
  descricao: string | null
  pasta: string
  capa_path: string | null
  largura: number
  altura: number
  criado_em: string
  autor: string
  autor_id: string
  jogadas: number
}

export interface GrupoDeAluno {
  autorId: string
  autor: string
  jogos: JogoPublico[]
  jogadas: number
}

/** Agrupa os jogos por aluno, em ordem alfabética; dentro do grupo, mais recentes primeiro. */
export function agruparPorAluno(jogos: readonly JogoPublico[]): GrupoDeAluno[] {
  const mapa = new Map<string, JogoPublico[]>()
  for (const j of jogos) mapa.set(j.autor_id, [...(mapa.get(j.autor_id) ?? []), j])
  return [...mapa.entries()]
    .map(([autorId, lista]) => ({
      autorId,
      autor: lista[0]!.autor,
      jogos: [...lista].sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
      jogadas: lista.reduce((s, j) => s + Number(j.jogadas || 0), 0)
    }))
    .sort((a, b) => a.autor.localeCompare(b.autor, 'pt-BR'))
}

/** Ranking do mais jogado para o menos jogado (empate: ordem alfabética). */
export function maisJogados(jogos: readonly JogoPublico[]): JogoPublico[] {
  return [...jogos].sort(
    (a, b) => Number(b.jogadas || 0) - Number(a.jogadas || 0) || a.titulo.localeCompare(b.titulo, 'pt-BR')
  )
}
