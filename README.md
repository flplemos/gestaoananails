# Ana Nails · Gestão

App mobile-first (PWA) para a Ana gerenciar atendimentos, clientes, despesas e faturamento.
Identidade visual herdada da landing [ananails.vercel.app](https://ananails.vercel.app/).

**Stack:** React 19 + Vite · Tailwind CSS 4 · React Router · Lucide · Supabase (Postgres, Auth, Edge Functions, pg_cron) · Vercel.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a publishable key do Supabase
npm run dev
```

Sem `.env.local` o app roda em **modo demonstração** (dados de exemplo no `localStorage`).

## Estrutura

```
src/
  components/   UI compartilhada (Sheet, Fab, AppointmentSheet, NotificationsCard…)
  context/      Auth, Data (CRUD) e Theme
  lib/          supabase, repositórios (local/Supabase), push, formatação
  mocks/        dados de exemplo
  pages/        Hoje, Despesas, Faturamento, Clientes, Ajustes, Login
api/keepalive.js                  Vercel Cron diário (evita pausa do Supabase Free)
supabase/schema.sql               tabelas + RLS + função de lembretes
supabase/functions/notify-upcoming Edge Function que envia o push
supabase/cron.sql                 pg_cron a cada 5 min chamando a função
```

## Lembretes (push)

1. `pg_cron` chama `notify-upcoming` a cada 5 minutos.
2. A função `claim_due_reminders` marca e retorna os atendimentos que começam na próxima hora (fuso America/Fortaleza).
3. A Edge Function envia Web Push (VAPID) para os aparelhos inscritos.

No iPhone (iOS 16.4+) o push só funciona com o app adicionado à Tela de Início.

## Deploy (Vercel)

Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`.
Opcional: `CRON_SECRET` (a Vercel envia no header do cron e o `/api/keepalive` passa a exigir).

## Demonstração pública (NailsApp)

O mesmo código gera a demonstração usada na landing page do NailsApp. Ela roda
sem Supabase (dados de exemplo salvos só no navegador), com marca neutra, uma
faixa de demonstração e um tour na primeira visita.

```bash
VITE_DEMO=true npm run build
```

- `VITE_DEMO=true` liga a marca neutra (`src/lib/brand.js`), a faixa e o tour
  (`src/components/DemoChrome.jsx`). Sem ela, o app é o da Ana, sem mudanças.
- `VITE_DEMO_CTA_URL` (opcional): para onde vai o botão "Quero usar". Na demo
  publicada (projeto `nailsapp-demo` no Cloudflare Pages) aponta para o WhatsApp
  com a mensagem "Oi! Testei a demonstração do NailsApp e quero usar.", para
  identificar quem veio pela demo. Sem ela, o botão leva ao contato da landing.
- Variáveis do projeto `nailsapp-demo`: `VITE_DEMO=true`, `NODE_VERSION=22` e
  `VITE_DEMO_CTA_URL`. Mudanças em variáveis só valem na próxima publicação.
- Não defina `VITE_SUPABASE_URL` nem `VITE_SUPABASE_PUBLISHABLE_KEY` na demo.
- `public/_headers` traz os cabeçalhos de segurança no Cloudflare Pages.
