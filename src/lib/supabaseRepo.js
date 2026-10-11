import { seedServices } from '../mocks/seed'
import { supabase } from './supabase'

/*
 * Repositório Supabase com a mesma interface do localRepo.
 * Converte camelCase (app) <-> snake_case (banco). O user_id é preenchido
 * pelo banco (default auth.uid()) e protegido por RLS.
 */

const TO_DB = { clientId: 'client_id', clientName: 'client_name' }
const FROM_DB = Object.fromEntries(Object.entries(TO_DB).map(([k, v]) => [v, k]))
const NUMERIC = ['price', 'total', 'amount']
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
    out[FROM_DB[k] ?? k] = NUMERIC.includes(k) ? Number(v) : v
  }
  if (typeof out.time === 'string') out.time = out.time.slice(0, 5) // "10:30:00" -> "10:30"
  return out
}

let seeding = null

const check = ({ data, error }) => {
  if (error) throw error
  return data
}

export const supabaseRepo = {
  async loadAll() {
    const [services, clients, appointments, expenses] = await Promise.all(
      ['services', 'clients', 'appointments', 'expenses'].map(async (t) =>
        check(await supabase.from(t).select('*')).map(fromRow),
      ),
    )
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
    return { services, clients, appointments, expenses }
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
