# Publicar na Cloudflare Pages

O caminho recomendado é conectar o repositório do GitHub à Pages. Assim cada `git push`
vira um deploy automático, e você nunca precisa rodar `wrangler` na mão.

---

## 1. Criar o projeto

No painel da Cloudflare: **Workers & Pages » Create » Pages » Connect to Git**, e escolha
o repositório.

Nas configurações de build:

| Campo | Valor |
|---|---|
| Framework preset | Nuxt (ou None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(vazio)* |

O `dist` não é engano. Quando o Nitro detecta que está rodando na Cloudflare, ele troca
o preset sozinho e passa a gerar `dist/` em vez de `.output/`.

---

## 2. Variáveis de ambiente

Em **Settings » Environment variables**, adicione nas duas seções
(*Production* e *Preview*):

```
SUPABASE_URL = https://xxxxxxxx.supabase.co
SUPABASE_KEY = eyJhbGciOi...   (a chave anon public)
```

A chave *anon* é pública por natureza: ela vai para o navegador de qualquer visitante.
Quem protege os dados é o RLS e a view do `schema.sql`, não o segredo da chave.
A chave *service_role* **nunca** entra aqui.

---

## 3. A flag que quase todo mundo esquece

O `wrangler.toml` deste repositório já traz:

```toml
compatibility_flags = ["nodejs_compat"]
```

Sem ela o deploy sobe normalmente e o site responde **500** na primeira visita, porque o
Nuxt usa APIs de Node no runtime. Se a Pages ignorar o arquivo por algum motivo, marque
a flag à mão em **Settings » Runtime » Compatibility flags**, nos dois ambientes.

---

## 4. Ajustar o Supabase ao domínio novo

No painel do Supabase, em **Authentication » URL Configuration**, coloque o domínio da
Pages (`https://publicador-mundo-ludico.pages.dev` ou o domínio próprio) em *Site URL*.
O login por e-mail e senha funciona sem isso, mas qualquer fluxo de e-mail
(recuperar senha, convite) manda o professor para o endereço errado.

---

## 5. Domínio próprio

Em **Custom domains**, aponte algo como `jogos.mundoludico.com.br`. Se o DNS já estiver
na Cloudflare, é um clique; se não, ela mostra os registros para criar.

---

## Alternativa: deploy manual

Se preferir não conectar o GitHub:

```bash
npm run build
npx wrangler pages deploy dist --project-name publicador-mundo-ludico
```

O `wrangler` pede login no navegador na primeira vez. Funciona, mas aí todo deploy passa
a ser manual, e a equipe perde o histórico de qual commit está no ar.
