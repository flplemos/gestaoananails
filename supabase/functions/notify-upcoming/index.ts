// Edge Function: envia os lembretes push 5h e 3h antes de cada atendimento.
// Chamada a cada 5 min pelo pg_cron (ver supabase/cron.sql).
// Secrets necessários: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados pelo Supabase.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Minutos antes do atendimento em que cada lembrete é enviado.
const OFFSETS = [300, 180]

/** 185 -> "3h05", 120 -> "2h", 45 -> "45 min" */
const formatLeft = (min: number) => {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

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

  const { data: due, error } = await supabase.rpc('claim_due_reminders', { offsets: OFFSETS })
  if (error) return json({ error: error.message }, 500)
  if (!due?.length) return json({ due: 0, sent: 0 })

  const userIds = [...new Set(due.map((d) => d.user_id))]
  const { data: subs } = await supabase.from('push_subscriptions').select('*').in('user_id', userIds)

  let sent = 0
  const failed: { status?: number; body?: string }[] = []
  for (const appt of due) {
    const payload = JSON.stringify({
      title: `⏰ ${appt.client_name} às ${appt.starts_at}`,
      body: `Em ${formatLeft(appt.minutes_left)}${appt.services ? ` · ${appt.services}` : ''}`,
      url: '/',
      tag: `${appt.appointment_id}-${appt.minutes_left}`,
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
        const { statusCode: status, body } = err as { statusCode?: number; body?: string }
        failed.push({ status, body: body ?? String(err) })
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('push failed', status, body ?? err)
        }
      }
    }
  }
  // A resposta fica salva em net._http_response (útil para diagnosticar).
  return json({ due: due.length, subscriptions: subs?.length ?? 0, sent, failed })
})
