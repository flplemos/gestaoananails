// Edge Function: envia push para os atendimentos que começam em ~1 hora.
// Chamada a cada 5 min pelo pg_cron (ver supabase/cron.sql).
// Secrets necessários: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados pelo Supabase.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MINUTES_AHEAD = 60

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return json({ error: 'unauthorized' }, 401)
  }

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )
  // Projetos novos expõem as chaves novas (sb_secret_…) em SUPABASE_SECRET_KEYS.
  const serviceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  const { data: due, error } = await supabase.rpc('claim_due_reminders', { minutes_ahead: MINUTES_AHEAD })
  if (error) return json({ error: error.message }, 500)
  if (!due?.length) return json({ due: 0, sent: 0 })

  const userIds = [...new Set(due.map((d) => d.user_id))]
  const { data: subs } = await supabase.from('push_subscriptions').select('*').in('user_id', userIds)

  let sent = 0
  for (const appt of due) {
    const payload = JSON.stringify({
      title: `⏰ ${appt.client_name} às ${appt.starts_at}`,
      body: appt.services ? `Daqui a pouco: ${appt.services}` : 'Atendimento daqui a pouco',
      url: '/',
      tag: appt.appointment_id,
    })
    for (const sub of (subs ?? []).filter((s) => s.user_id === appt.user_id)) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 60 * 60, urgency: 'high' },
        )
        sent++
      } catch (err) {
        // 404/410: inscrição expirada (app removido ou permissão revogada).
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('push failed', status, err)
        }
      }
    }
  }
  return json({ due: due.length, sent })
})
