/**
 * Entregador de jogos — Escola Mundo Lúdico
 *
 * O Supabase Storage não deixa HTML rodar: entrega index.html como text/plain
 * com CSP "sandbox". Este Worker busca os arquivos do bucket público "jogos"
 * e devolve cada um com o tipo certo, para o export do Construct 3 rodar.
 *
 * Ele fica num domínio SEPARADO do painel de propósito: o código de um jogo
 * enviado roda aqui e não alcança a sessão do professor no site principal.
 *
 * Caminho aceito: /<uuid do jogo>/<arquivo do export>
 */

const PASTA_DO_JOGO = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(.*)$/
const CACHE_SEGUNDOS = 60 * 60 * 24

const TIPOS = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8', css: 'text/css; charset=utf-8',
  wasm: 'application/wasm', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', wav: 'audio/wav',
  webm: 'video/webm', mp4: 'video/mp4', woff: 'font/woff', woff2: 'font/woff2',
  ttf: 'font/ttf', otf: 'font/otf', txt: 'text/plain; charset=utf-8',
  xml: 'application/xml', webmanifest: 'application/manifest+json'
}

function tipoDe(caminho) {
  const ext = caminho.split('.').pop()?.toLowerCase() ?? ''
  return TIPOS[ext] ?? 'application/octet-stream'
}

function resposta(status, texto) {
  return new Response(texto, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' }
  })
}

/** Separa e valida o caminho. Devolve null se não for um arquivo de jogo válido. */
function lerCaminho(pathname) {
  let decodificado
  try {
    decodificado = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const m = PASTA_DO_JOGO.exec(decodificado)
  if (!m) return null
  const arquivo = m[2] === '' ? 'index.html' : m[2]
  const partes = arquivo.split('/')
  if (partes.some((p) => p === '' || p === '.' || p === '..')) return null
  return { jogo: m[1], arquivo }
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return resposta(405, 'Método não permitido.')
    }

    const url = new URL(request.url)

    // /<uuid> sem a barra final quebraria os caminhos relativos do export.
    if (PASTA_DO_JOGO.test(url.pathname + '/') && !url.pathname.slice(1).includes('/')) {
      return Response.redirect(`${url.origin}${url.pathname}/`, 301)
    }

    const alvo = lerCaminho(url.pathname)
    if (!alvo) return resposta(404, 'Jogo não encontrado.')

    const caminhoStorage = `${alvo.jogo}/${alvo.arquivo}`.split('/').map(encodeURIComponent).join('/')
    const origem = `${env.SUPABASE_URL}/storage/v1/object/public/jogos/${caminhoStorage}`

    let r
    try {
      r = await fetch(origem, { cf: { cacheTtl: CACHE_SEGUNDOS, cacheEverything: true } })
    } catch (e) {
      console.error('falha ao buscar no storage', origem, e)
      return resposta(502, 'Não foi possível carregar o jogo agora. Tente de novo.')
    }

    if (r.status === 400 || r.status === 404) return resposta(404, 'Arquivo não encontrado.')
    if (!r.ok) {
      console.error('storage respondeu', r.status, origem)
      return resposta(502, 'Não foi possível carregar o jogo agora. Tente de novo.')
    }

    const headers = new Headers({
      'content-type': tipoDe(alvo.arquivo),
      'cache-control': `public, max-age=${CACHE_SEGUNDOS}`,
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      // Só o site do publicador (e os previews dele) pode mostrar o jogo num iframe.
      'content-security-policy': `frame-ancestors 'self' ${env.SITES_PERMITIDOS}`
    })
    const tamanho = r.headers.get('content-length')
    if (tamanho) headers.set('content-length', tamanho)

    return new Response(request.method === 'HEAD' ? null : r.body, { status: 200, headers })
  }
}
