import { buildSeed } from '../mocks/seed'
import { uid } from './format'

/*
 * Repositório local (mock) persistido no localStorage.
 * Expõe a mesma interface assíncrona que o repositório do Supabase terá,
 * para que as telas não precisem mudar quando o banco for plugado.
 */

const KEY = 'ananails:data:v1'
export const COLLECTIONS = ['services', 'clients', 'appointments', 'expenses']

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* localStorage indisponível ou corrompido: recomeça com o seed */
  }
  const seed = buildSeed()
  save(seed)
  return seed
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* modo privado: mantém só em memória */
  }
}

let db = null
const getDb = () => (db ??= load())

export const localRepo = {
  async loadAll() {
    const data = getDb()
    return Object.fromEntries(COLLECTIONS.map((c) => [c, [...(data[c] ?? [])]]))
  },

  async create(collection, values) {
    const row = { ...values, id: uid() }
    const data = getDb()
    data[collection] = [...(data[collection] ?? []), row]
    save(data)
    return row
  },

  async update(collection, id, values) {
    const data = getDb()
    let updated = null
    data[collection] = data[collection].map((row) =>
      row.id === id ? (updated = { ...row, ...values, id }) : row,
    )
    save(data)
    return updated
  },

  async remove(collection, id) {
    const data = getDb()
    data[collection] = data[collection].filter((row) => row.id !== id)
    save(data)
  },

  async reset() {
    db = buildSeed()
    save(db)
  },
}
