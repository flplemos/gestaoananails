import { seedServices } from '../mocks/seed'
import { supabase } from './supabase'

/*
 * Repositório Supabase com a mesma interface do localRepo.
 * Converte camelCase (app) <-> snake_case (banco). O user_id é preenchido
 * pelo banco (default auth.uid()) e protegido por RLS.
 */

const TO_DB = { clientId: 'client_id', clientName: 'client_name', monthlyGoal: 'monthly_goal' }
const FROM_DB = Object.fromEntries(Object.entries(TO_DB).map(([k, v]) => [v, k]))
const NUMERIC = ['price', 'total', 'amount', 'monthly_goal']
const HIDDEN = ['user_id', 'created_at', 'reminders_sent']

const toRow = (values) => {
  const row = {}
  for (const [k, v] of Object.entries(values)) if (k !== 'id') row[TO_DB[k] ?? k] = v
  return row
}

const fromRow = (row) => {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (HIDDEN.includes(k)) continue
    out[FROM_DB[k] ?? k] = NUMERIC.includes(k) && v != null ? Number(v) : v
  }
  if (typeof out.time === 'string') out.time = out.time.slice(0, 5) // "10:30:00" -> "10:30"
  return out
}

let seeding = null

// O PostgREST devolve no máximo 1000 linhas por consulta (padrão do Supabase).
// Sem paginar, o histórico seria cortado em silêncio depois de 1000
// atendimentos e o faturamento sairia errado.
const PAGE = 1000

async function fetchAll(table) {
  const rows = []
  for (;;) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order('id')
      .range(rows.length, rows.length + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length === 0 || rows.length >= (count ?? 0)) return rows.map(fromRow)
  }
}

const check = ({ data, error }) => {
  if (error) throw error
  return data
}

export const supabaseRepo = {
  async loadAll() {
    // Tudo em paralelo. `settings` é tolerante: se a migração 005 ainda não
    // rodou, o app segue sem meta.
    const [services, clients, appointments, expenses, settings] = await Promise.all([
      ...['services', 'clients', 'appointments', 'expenses'].map(fetchAll),
      fetchAll('settings').catch(() => []),
    ])
    // Primeira vez: cria o catálogo padrão da Ana (uma única vez, mesmo com o
    // efeito duplicado do StrictMode em dev).
    if (services.length === 0) {
      seeding ??= supabase
        .from('services')
        .insert(seedServices.map(({ name, price, duration }) => ({ name, price, duration })))
        .select()
        .then((res) => check(res).map(fromRow))
      services.push(...(await seeding))
    }
    return { services, clients, appointments, expenses, settings }
  },

  async create(collection, values) {
    return fromRow(check(await supabase.from(collection).insert(toRow(values)).select().single()))
  },

  async update(collection, id, values) {
    return fromRow(check(await supabase.from(collection).update(toRow(values)).eq('id', id).select().single()))
  },

  async remove(collection, id) {
    check(await supabase.from(collection).delete().eq('id', id))
  },
}
