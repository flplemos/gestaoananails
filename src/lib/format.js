const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatBRL = (value) => brl.format(Number(value) || 0)

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const pad = (n) => String(n).padStart(2, '0')

/** Data local no formato YYYY-MM-DD (evita o deslocamento de fuso do toISOString). */
export const toISODate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromISODate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso, days) => {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** "2026-10" a partir de "2026-10-11". */
export const monthKey = (iso) => iso.slice(0, 7)

export const addMonths = (key, months) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + months, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const formatMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export const formatDayLabel = (iso) => {
  const today = toISODate()
  if (iso === today) return 'Hoje'
  if (iso === addDays(today, -1)) return 'Ontem'
  if (iso === addDays(today, 1)) return 'Amanhã'
  return fromISODate(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export const formatLongDate = (iso) =>
  capitalize(
    fromISODate(iso).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  )

/** Converte "84 98619-1521" em "5584986191521" para o link wa.me. */
export const whatsappNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length <= 11 ? `55${digits}` : digits
}

export const formatPhone = (phone) => {
  const d = String(phone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
