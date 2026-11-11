// Marca colocada no usuário (user_metadata) quando a conta é criada com senha
// provisória. Enquanto ela existir, o professor só acessa a tela de troca de senha.
export const PRECISA_TROCAR_SENHA = 'trocar_senha'
export const ROTA_TROCAR_SENHA = '/admin/trocar-senha'
export const TAMANHO_MINIMO_SENHA = 12

interface ComMetadata {
  user_metadata?: Record<string, unknown>
}

export function precisaTrocarSenha(user: ComMetadata | null | undefined): boolean {
  return user?.user_metadata?.[PRECISA_TROCAR_SENHA] === true
}
