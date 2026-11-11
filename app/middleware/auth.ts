export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo({ path: '/admin/login', query: { voltar: to.fullPath } })
  }

  if (precisaTrocarSenha(user.value) && to.path !== ROTA_TROCAR_SENHA) {
    return navigateTo({ path: ROTA_TROCAR_SENHA, query: { voltar: to.fullPath } })
  }
})
