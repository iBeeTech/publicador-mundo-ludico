// Dados de contato e funcionamento da Escola Mundo Lúdico.
// Tudo que aparece no site sobre a escola sai daqui: mude num lugar só.

export const ESCOLA_NOME = 'Escola Mundo Lúdico'

export const WHATSAPP_NUMERO = '5516999979226'
export const WHATSAPP_EXIBICAO = '(16) 99997-9226'
export const WHATSAPP_MENSAGEM =
  'Olá! Vim do site de jogos da Mundo Lúdico e gostaria de Agendar uma Aula'
export const WHATSAPP_LINK =
  `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM)}`

export const ENDERECO_LINHAS = ['R. Nuno Alberto, 1935 - Centro', 'Franca - SP, 14400-330'] as const
export const MAPA_LINK =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Escola Mundo Lúdico, R. Nuno Alberto, 1935 - Centro, Franca - SP, 14400-330')

export interface Horario {
  dias: string
  horas: string
}

export const HORARIOS: readonly Horario[] = [
  { dias: 'Segunda a quinta', horas: '8h às 20h' },
  { dias: 'Sexta', horas: '8h às 17h' },
  { dias: 'Sábado', horas: '8h às 12h' },
  { dias: 'Domingo', horas: 'Fechado' }
]
