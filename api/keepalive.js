// Vercel Cron (ver vercel.json): faz 1 consulta diária ao Supabase para o
// projeto do plano gratuito não ser pausado por inatividade (7 dias).
// A Vercel envia "Authorization: Bearer <CRON_SECRET>" automaticamente quando
// a variável CRON_SECRET existe no projeto. Sem ela, o endpoint fica fechado.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret) return res.status(500).json({ error: 'CRON_SECRET não configurado' })
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return res.status(500).json({ error: 'Supabase env vars ausentes' })

  const response = await fetch(`${url}/rest/v1/services?select=id&limit=1`, {
    headers: { apikey: key },
  })
  return res.status(response.ok ? 200 : 502).json({ ok: response.ok, status: response.status, at: new Date().toISOString() })
}
