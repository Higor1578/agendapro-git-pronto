# AgendaPro SaaS

App React/PWA para agendamento de lava jato, barbearia, manicure e salao de beleza.

## Como abrir

Clique duas vezes em `INICIAR_APP.bat` ou rode:

```bash
npm.cmd run dev -- --port 5173
```

Depois abra:

```text
http://localhost:5173
```

Nao abra o `index.html` direto, porque React/Vite precisa do servidor local.

## Areas

- Cliente: `http://localhost:5173/#/cliente`
- Admin do negocio: `http://localhost:5173/#/admin`
- Super admin: `http://localhost:5173/#/super-admin`

Os agendamentos e negocios criados ficam salvos no `localStorage` do navegador.

## Conectar com Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor do Supabase.
3. Cole e execute o arquivo `supabase/schema.sql`.
4. Copie `.env.example` para `.env.local`.
5. Preencha:

```text
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

6. Reinicie o app com `INICIAR_APP.bat`.

Quando estiver conectado, o app mostra `Conectado ao Supabase` no topo.

## Subir no GitHub e Vercel

Antes de subir, confira que `.env.local`, `node_modules` e `dist` nao vao para o Git. Eles ja estao no `.gitignore`.

```bash
git init
git add .
git commit -m "Criar AgendaPro SaaS React PWA"
```

Depois crie um repositorio no GitHub e rode os comandos que o GitHub mostrar, normalmente:

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

No Vercel:

1. Clique em **Add New Project**.
2. Importe o repositorio do GitHub.
3. Framework: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Em **Environment Variables**, adicione:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Depois publique. O Vercel vai gerar um link publico para testar o app.
