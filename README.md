# Publicador de Jogos — Escola Mundo Lúdico

Área logada onde o professor cadastra alunos e sobe os jogos que eles exportaram do
Construct 3, e uma galeria pública onde qualquer pessoa joga pelo navegador.

Nuxt 4 + Supabase (autenticação, banco e storage). Sem servidor próprio: o ZIP é
descompactado **no navegador** e os arquivos vão direto para o Storage.

---

## O que você precisa saber antes

**O Construct 3 não exporta um arquivo HTML.** O export Web (HTML5) é uma pasta com
`index.html`, `data.json`, `scripts/c3runtime.js`, `images/`, `media/` e outros, com
caminhos relativos entre eles. Um jogo simples dá de 3 a 8 MB.

Por isso o professor sobe o **ZIP da pasta exportada**. O sistema confere se é mesmo um
export do Construct, descompacta e envia cada arquivo mantendo a estrutura. Se os
caminhos quebrarem, o jogo abre com a tela preta — é o erro mais comum nesse tipo de
plataforma, e é justamente o que esta parte evita.

---

## Instalação

### 1. Criar o projeto no Supabase

1. Em [supabase.com](https://supabase.com), crie um projeto novo.
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode. Isso cria
   as tabelas, as políticas de segurança, a view pública e o bucket `jogos`.
3. Vá em **Project Settings » API** e copie:
   - *Project URL*
   - *anon public key*

### 2. Criar a conta de professor

Em **Authentication » Users » Add user**, crie o usuário com e-mail e senha e marque
*Auto Confirm User*.

Não existe tela de cadastro no site, de propósito: quem cria professor é você, pelo
painel do Supabase. Para cada professor novo, repita este passo.

### 3. Rodar o projeto

```bash
cp .env.example .env     # e preencha com a URL e a chave do passo 1
npm install
npm run dev              # http://localhost:3000
```

### 4. Publicar na internet

Funciona em qualquer host que rode Node ou em modo estático. O mais direto:

```bash
npm run build
```

Depois suba a pasta `.output/` para Vercel, Netlify ou Cloudflare Pages, configurando
`SUPABASE_URL` e `SUPABASE_KEY` como variáveis de ambiente lá.

---

## Como usar no dia a dia

1. **Cadastre o aluno** em *Alunos*. O nome completo fica só no painel; a galeria mostra
   apenas o nome de exibição, sugerido automaticamente no formato `Gabriel S.`
2. **Marque a autorização do responsável** quando tiver o termo assinado.
3. **Publique o jogo** em *Publicar jogo*: escolha o ZIP, o aluno, dê um nome e envie.
4. O jogo aparece na galeria pública em `/`.

### A trava de autorização

Um jogo só aparece publicamente quando **as duas** condições são verdadeiras:
o jogo está marcado como publicado **e** o aluno tem autorização registrada.

Essa regra não está no código da tela: está na view `vw_jogos_publicos`, no banco. Mesmo
que alguém marque o jogo como publicado por engano, ele não vaza. O painel mostra esses
casos com a etiqueta *retido: sem autorização*.

---

## Estrutura

```
app/
  pages/
    index.vue                 galeria pública
    jogo/[id].vue             player, em iframe
    admin/login.vue           entrada do professor
    admin/index.vue           painel: lista, publica, despublica, apaga
    admin/alunos.vue          cadastro de alunos e autorizações
    admin/jogos/novo.vue      upload do ZIP
  composables/
    useExportConstruct.ts     lê o ZIP, valida e envia ao Storage
    useStorageUrl.ts          URL pública de um arquivo
  middleware/auth.ts          protege /admin
supabase/schema.sql           tabelas, RLS, view pública e bucket
```

---

## Decisões que valem explicar

**Por que descompactar no navegador.** Unzip no servidor exigiria uma função serverless
com limite de tempo e memória, e um arquivo de 40 MB costuma estourar. No navegador não
há limite prático, o progresso aparece para o professor, e o projeto fica sem backend.

**Por que o id do jogo vira o nome da pasta.** Cada jogo mora em `jogos/<uuid>/`. Dois
alunos podem ter jogos com o mesmo nome sem conflito, e apagar um jogo é apagar um prefixo.

**Por que o registro é criado antes do upload.** É preciso ter o `id` para montar o
caminho da pasta. Se o envio falhar no meio, o registro é desfeito automaticamente, então
não sobra jogo quebrado na lista.

**Por que a capa sai do próprio export.** O Construct já gera `icons/icon-*.png`. O
sistema pega o maior deles e usa como capa, sem pedir mais uma imagem ao professor.

---

## Limites e custos

| Item | Free tier do Supabase |
|---|---|
| Storage | 1 GB — cerca de 150 jogos de 6 MB |
| Transferência | 5 GB por mês |
| Banco | 500 MB, muito acima do necessário aqui |

Quando o storage apertar, as duas saídas são o plano Pro do Supabase ou mover só os
arquivos para o Cloudflare R2, que tem 10 GB grátis e não cobra transferência de saída —
o que pesa mais numa galeria pública de jogos. O resto do projeto não muda: só a função
`useStorageUrl` e a chamada de upload.

O limite de upload por jogo está em 60 MB, em `app/pages/admin/jogos/novo.vue`.
Quando um export passa disso, quase sempre é áudio em WAV: exportar os sons em MP3 ou OGG
resolve.

---

## O que ainda não existe

- Conta para aluno. Hoje quem sobe é o professor.
- Edição de um jogo já publicado: o caminho é apagar e subir de novo.
- Contador de quantas vezes cada jogo foi jogado.
- Capa personalizada, diferente do ícone do export.
