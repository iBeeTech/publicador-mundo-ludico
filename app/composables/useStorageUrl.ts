/** URL pública de um arquivo dentro do bucket "jogos". */
export function useStorageUrl() {
  const supabase = useSupabaseClient()
  return (caminho: string | null | undefined) => {
    if (!caminho) return null
    return supabase.storage.from('jogos').getPublicUrl(caminho).data.publicUrl
  }
}
