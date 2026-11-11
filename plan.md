# Plano — conversão de alunos e engajamento

Próximos passos do Arcade Mundo Lúdico, em ordem de prioridade.
Cada item diz **o que fazer**, **onde mexer** e **como saber que ficou pronto**.

Legenda de esforço: 🟢 baixo (até 1h) · 🟡 médio (meio dia) · 🔴 alto (1 dia ou mais)

---

## Fase 0 — Pendências (fazer antes de tudo)

### 0.1 Desligar o cadastro aberto no Supabase 🟢 — segurança
- **Por quê:** o schema trata *qualquer* usuário logado como professor. Com o cadastro aberto,
  qualquer pessoa cria conta pela API (a chave anon é pública) e passa a ver e editar dados das crianças.
- **Como:** Supabase › Authentication › Sign In / Providers › desligar *Allow new users to sign up*
  (ou `disable_signup: true` via Management API).
- **Pronto quando:** `POST /auth/v1/signup` com a chave anon responde erro de cadastro desabilitado.

### 0.2 Capa ao publicar jogo novo 🟡
- **Por quê:** hoje a capa vem do ícone do Construct; as capas com cena do jogo foram feitas à mão.
- **Como:** campo opcional "Imagem de capa" em `app/pages/admin/jogos/novo.vue`, enviado para
  `<pasta>/capa.webp` no bucket `jogos`, gravando `capa_path`. Sem imagem, mantém o ícone do export.
- **Pronto quando:** um jogo publicado pelo painel com capa aparece com ela na galeria.

---

## Fase 1 — Cada jogo vira propaganda mensurável (fazer junto)

### 1.1 Medir cliques em "Agendar aula" 🟢
- **Por quê:** sem medir, não dá para saber se o site traz alunos.
- **Como:** tabela `cliques_agendar (id, origem text, jogo_id uuid null, criado_em)` + função
  `registrar_clique_agendar(origem, jogo)` com `security definer`, liberada para `anon`
  (mesmo padrão de `registrar_jogada` em `supabase/schema.sql`).
  Chamar no `@click` do `BotaoAgendar.vue` e do botão da navbar, sem bloquear a abertura do WhatsApp.
- **Origens:** `navbar`, `rodape`, `pagina-jogo`, `galeria`.
- **Pronto quando:** o painel do professor mostra "X cliques em Agendar aula nos últimos 30 dias",
  separado por origem.

### 1.2 Botão "Compartilhar no WhatsApp" na página do jogo 🟢
- **Por quê:** o pai mostra o jogo do filho para a família — é a divulgação mais forte e gratuita.
- **Como:** em `app/pages/jogo/[id].vue`, link `https://wa.me/?text=` com
  "Olha o jogo que {autor} criou na Escola Mundo Lúdico: {link}". Usar `navigator.share` quando existir (celular).
- **Pronto quando:** no celular abre a folha de compartilhamento; no computador abre o WhatsApp Web com o texto.

### 1.3 Prévia bonita do link (Open Graph por jogo) 🟢
- **Por quê:** link colado no WhatsApp mostra a cena do jogo em vez da logo genérica.
- **Como:** `useSeoMeta` em `app/pages/jogo/[id].vue` com `ogTitle` = título do jogo,
  `ogDescription` = "Jogo criado por {autor} na Escola Mundo Lúdico", `ogImage` = URL pública de `capa_path`.
  A página já é renderizada no servidor (SSR), então as tags saem no HTML.
- **Pronto quando:** o link de um jogo colado no WhatsApp mostra a capa e o nome.

### 1.4 Mensagem do WhatsApp com a origem 🟢
- **Por quê:** a escola sabe qual jogo trouxe o contato e já tem assunto para a conversa.
- **Como:** `BotaoAgendar.vue` recebe prop opcional `jogo`; a mensagem vira
  "Olá! Vim do site de jogos da Mundo Lúdico (jogo {titulo}) e gostaria de Agendar uma Aula".
  Sem jogo, mantém a frase padrão de `app/utils/escola.ts`.
- **Pronto quando:** o botão da página do Sapo abre o WhatsApp citando "Sapo Atravessa".

---

## Fase 2 — Dar confiança ao pai

### 2.1 Seção "Como são as aulas" 🟡
- **Dados necessários (pedir para a escola):** faixa de idade, duração e frequência da aula,
  o que a criança aprende, se existe aula experimental grátis.
- **Como:** componente `ComoSaoAsAulas.vue` com 3 ou 4 blocos curtos (ícone + frase), abaixo da galeria
  e acima do rodapé, com um `BotaoAgendar` no fim.
- **Pronto quando:** um pai entende idade, duração e oferta sem precisar perguntar no WhatsApp.

### 2.2 Depoimentos de pais e fotos das aulas 🟡
- **Atenção:** fotos e nomes só com autorização por escrito do responsável (mesma regra da galeria).
- **Como:** tabela `depoimentos (texto, autor, publicado)` gerenciada no painel, ou lista fixa em
  `app/utils/escola.ts` para começar.
- **Pronto quando:** 3 depoimentos aparecem na página inicial.

### 2.3 QR code para material impresso 🟢
- **Como:** gerar QR para `https://publicador-mundo-ludico.pages.dev/?origem=qr` e usar a origem `qr`
  no contador do item 1.1.
- **Uso:** cartaz na recepção, panfleto, apresentação de fim de semestre.

### 2.4 Aparecer no Google de Franca 🟡
- **Como:** `title` e `description` focados em "curso de programação para crianças em Franca - SP";
  dados estruturados `schema.org/EducationalOrganization` (endereço, telefone, horário de `escola.ts`);
  link para o perfil da escola no Google Maps; `sitemap.xml` com as páginas de jogos.
- **Pronto quando:** o Rich Results Test do Google valida os dados da escola.

---

## Fase 3 — Fazer a criança voltar (engajamento)

### 3.1 Página do aluno `/aluno/[id]` 🟡
- "Meus jogos", com avatar (inicial colorida ou escolha entre bonecos), total de jogadas e botão
  de compartilhar. Na galeria, o nome do aluno vira link para essa página.
- Usa só `nome_exibicao` (nunca o nome completo) e respeita a trava de autorização.

### 3.2 Estrelinhas (curtidas) nos jogos 🟡
- Coluna `estrelas` + função `dar_estrela(jogo)` liberada para `anon`, uma por navegador
  (mesmo controle por `sessionStorage`/`localStorage` usado nas jogadas).
- Mostrar a contagem no cartão e na página do jogo.

### 3.3 Jogo da semana 🟢
- Coluna `destaque boolean` em `jogos`, marcada no painel; o jogo aparece em um cartão grande
  no topo da galeria.

### 3.4 Medalhas do aluno 🔴
- Ex.: "Primeiro jogo publicado", "100 jogadas", "Jogo da semana". Calculadas a partir dos dados
  existentes, exibidas na página do aluno.

---

## Ordem sugerida

1. Fase 0 (0.1 é urgente)
2. Fase 1 inteira de uma vez — tudo é rápido e se complementa
3. Coletar dados da escola e fazer 2.1 e 2.3
4. 3.1 e 3.3, depois o restante conforme o resultado medido no item 1.1
