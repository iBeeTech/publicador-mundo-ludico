import JSZip from 'jszip'

/**
 * Lê o ZIP exportado pelo Construct 3 e envia os arquivos para o Storage.
 *
 * O export do Construct NÃO é um arquivo só: é uma pasta com index.html,
 * data.json, scripts/, images/ e media/, com caminhos relativos entre eles.
 * Por isso o ZIP é descompactado aqui no navegador e cada arquivo sobe
 * mantendo exatamente a mesma estrutura dentro de `<pasta>/`.
 */

const TIPOS: Record<string, string> = {
  html: 'text/html', htm: 'text/html', js: 'text/javascript', mjs: 'text/javascript',
  json: 'application/json', css: 'text/css', wasm: 'application/wasm',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', wav: 'audio/wav',
  webm: 'video/webm', mp4: 'video/mp4',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  txt: 'text/plain', xml: 'application/xml', webmanifest: 'application/manifest+json'
}

function tipoDe(nome: string) {
  const ext = nome.split('.').pop()?.toLowerCase() ?? ''
  return TIPOS[ext] ?? 'application/octet-stream'
}

export interface ArquivoDoExport {
  caminho: string          // caminho relativo, ex: "scripts/c3runtime.js"
  bytes: number
  blob: () => Promise<Blob>
}

export interface ExportLido {
  arquivos: ArquivoDoExport[]
  bytes: number
  capa: string | null      // ícone do próprio export, usado como capa
  largura: number
  altura: number
}

/** Confere se o ZIP é mesmo um export HTML5 do Construct e devolve os arquivos. */
export async function lerExport(zipFile: File): Promise<ExportLido> {
  const zip = await JSZip.loadAsync(zipFile)
  const todos = Object.values(zip.files).filter((f) => !f.dir)

  if (!todos.length) throw new Error('O ZIP está vazio.')

  // O ZIP pode ter os arquivos na raiz ou dentro de uma pasta. Acha o index.html
  // mais raso e usa a pasta dele como base.
  const indices = todos
    .filter((f) => f.name.toLowerCase().endsWith('index.html'))
    .sort((a, b) => a.name.split('/').length - b.name.split('/').length)

  if (!indices.length) {
    throw new Error(
      'Não achei um index.html dentro do ZIP. Confira se você zipou a pasta do export ' +
      'HTML5 do Construct 3, e não o arquivo .c3p do projeto.'
    )
  }

  const base = indices[0]!.name.slice(0, indices[0]!.name.length - 'index.html'.length)
  const daPasta = todos.filter((f) => f.name.startsWith(base))

  const temRuntime = daPasta.some((f) => /scripts\/.*c3runtime/i.test(f.name))
  if (!temRuntime) {
    throw new Error(
      'Este ZIP tem um index.html, mas não parece um export do Construct 3 ' +
      '(faltou scripts/c3runtime.js). Exporte de novo em Menu » Project » Export » Web (HTML5).'
    )
  }

  const arquivos: ArquivoDoExport[] = daPasta.map((f) => ({
    caminho: f.name.slice(base.length),
    // @ts-expect-error _data existe no JSZip e traz o tamanho sem descomprimir
    bytes: (f._data?.uncompressedSize as number) ?? 0,
    blob: () => f.async('blob')
  }))

  const bytes = arquivos.reduce((s, a) => s + a.bytes, 0)

  // Capa: o maior ícone que o próprio Construct gerou.
  const icones = arquivos
    .filter((a) => /^icons\/.*\.png$/i.test(a.caminho))
    .sort((a, b) => b.bytes - a.bytes)
  const capa = icones[0]?.caminho ?? null

  // Tamanho da tela: vem do data.json do export.
  let largura = 800
  let altura = 600
  const data = daPasta.find((f) => f.name === base + 'data.json')
  if (data) {
    try {
      const json = JSON.parse(await data.async('string'))
      const vp = json?.project?.[10] ?? json?.project?.find?.((v: unknown) => Array.isArray(v) && v.length === 2)
      if (Array.isArray(vp) && typeof vp[0] === 'number' && typeof vp[1] === 'number') {
        largura = vp[0]
        altura = vp[1]
      }
    } catch {
      /* se o formato mudar, fica no padrão 800x600 e o professor ajusta à mão */
    }
  }

  return { arquivos, bytes, capa, largura, altura }
}

/** Sobe os arquivos para o bucket, em lotes, chamando `aoProgredir` a cada um. */
export async function enviarExport(
  storage: { upload: (caminho: string, corpo: Blob, opcoes: Record<string, unknown>) => Promise<{ error: { message: string } | null }> },
  pasta: string,
  arquivos: ArquivoDoExport[],
  aoProgredir: (feitos: number, total: number) => void
) {
  const LOTE = 6
  let feitos = 0
  for (let i = 0; i < arquivos.length; i += LOTE) {
    const lote = arquivos.slice(i, i + LOTE)
    await Promise.all(
      lote.map(async (a) => {
        const corpo = await a.blob()
        const { error } = await storage.upload(pasta + a.caminho, corpo, {
          contentType: tipoDe(a.caminho),
          cacheControl: '31536000',
          upsert: true
        })
        if (error) throw new Error('Falhou ao enviar ' + a.caminho + ': ' + error.message)
        feitos++
        aoProgredir(feitos, arquivos.length)
      })
    )
  }
}

export function formatarBytes(b: number) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}
