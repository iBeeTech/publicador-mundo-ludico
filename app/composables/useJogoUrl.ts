/**
 * Endereço para JOGAR um jogo: passa pelo Worker "entregador", que serve o
 * index.html como página de verdade. Imagens soltas (capa) podem continuar
 * vindo direto do Storage via useStorageUrl.
 */
export function useJogoUrl() {
  const base = useRuntimeConfig().public.jogosBaseUrl.replace(/\/+$/, '')
  return (pasta: string | null | undefined): string | null => {
    if (!pasta) return null
    return `${base}/${pasta.replace(/^\/+/, '')}index.html`
  }
}
