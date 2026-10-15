import { addDays, addMonths, fromISODate, toISODate } from './format'

/*
 * Números da tela de Faturamento e a lista "Para chamar" de Clientes.
 * Só atendimentos concluídos ("Feito") contam como faturamento.
 */

const pad = (n) => String(n).padStart(2, '0')
const sumBy = (list, fn) => list.reduce((s, x) => s + Number(fn(x) || 0), 0)

/** Faturamento, despesas e lucro de atendimentos/despesas já filtrados. */
function totals(appointments, expenses) {
  const done = appointments.filter((a) => a.done)
  const revenue = sumBy(done, (a) => a.total)
  const spent = sumBy(expenses, (e) => e.amount)
  return { revenue, expenses: spent, profit: revenue - spent, count: done.length }
}

/** Ranking de serviços por valor (preço de cada item nos atendimentos feitos). */
export function topServices(appointments) {
  const map = new Map()
  for (const a of appointments) {
    if (!a.done) continue
    for (const item of a.items ?? []) {
      const row = map.get(item.name) ?? { name: item.name, revenue: 0, count: 0 }
      row.revenue += Number(item.price) || 0
      row.count += 1
      map.set(item.name, row)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

/** % de variação; null quando não há base de comparação. */
const variation = (current, previous) => (previous > 0 ? Math.round(((current - previous) / previous) * 100) : null)

/**
 * Resumo do mês `key` ("2026-10"). Para o mês corrente, a comparação usa o
 * mês anterior só até o mesmo dia — senão todo começo de mês pareceria ruim.
 */
export function monthSummary(key, appointments, expenses, today = toISODate()) {
  const inMonth = (d) => d.startsWith(key)
  const isCurrent = today.startsWith(key)
  const prevKey = addMonths(key, -1)
  const cutoffDay = isCurrent ? today.slice(8, 10) : '31'
  const inPrev = (d) => d.startsWith(prevKey) && d.slice(8, 10) <= cutoffDay

  const monthAppts = appointments.filter((a) => inMonth(a.date))
  const current = totals(monthAppts, expenses.filter((e) => inMonth(e.date)))
  const previous = totals(
    appointments.filter((a) => inPrev(a.date)),
    expenses.filter((e) => inPrev(e.date)),
  )
  const scheduled = monthAppts.filter((a) => !a.done && a.date >= today)

  return {
    ...current,
    prevKey,
    partialComparison: isCurrent,
    change: variation(current.profit, previous.profit),
    ticket: current.count ? current.revenue / current.count : 0,
    scheduled: sumBy(scheduled, (a) => a.total),
    scheduledCount: scheduled.length,
    services: topServices(monthAppts),
  }
}

/**
 * Resumo do ano. Para o ano corrente, compara com o ano anterior até a
 * mesma data.
 */
export function yearSummary(year, appointments, expenses, today = toISODate()) {
  const y = String(year)
  const isCurrent = today.startsWith(y)
  const cutoff = isCurrent ? today.slice(5) : '12-31'
  const prevY = String(year - 1)
  const inYear = (d) => d.startsWith(y)
  const inPrev = (d) => d.startsWith(prevY) && d.slice(5) <= cutoff

  const yearAppts = appointments.filter((a) => inYear(a.date))
  const yearExpenses = expenses.filter((e) => inYear(e.date))
  const current = totals(yearAppts, yearExpenses)
  const previous = totals(
    appointments.filter((a) => inPrev(a.date)),
    expenses.filter((e) => inPrev(e.date)),
  )

  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${y}-${pad(i + 1)}`
    return {
      key,
      index: i,
      future: isCurrent && key > today.slice(0, 7),
      ...totals(
        yearAppts.filter((a) => a.date.startsWith(key)),
        yearExpenses.filter((e) => e.date.startsWith(key)),
      ),
    }
  })
  const active = months.filter((m) => m.revenue || m.expenses)
  const best = active.reduce((b, m) => (!b || m.profit > b.profit ? m : b), null)

  return {
    ...current,
    prevYear: year - 1,
    partialComparison: isCurrent,
    change: variation(current.profit, previous.profit),
    months,
    best,
    average: active.length ? current.profit / active.length : 0,
    services: topServices(yearAppts),
  }
}

/** Prazo máximo para a cliente voltar (definido pela Ana: 30 dias). */
export const RETURN_DAYS = 30
/** Começa a aparecer em "Para chamar" alguns dias antes de vencer. */
export const RETURN_WARNING_DAYS = 3

const daysBetween = (fromIso, toIso) => Math.round((fromISODate(toIso) - fromISODate(fromIso)) / 86_400_000)

/**
 * Clientes cuja última visita concluída foi há RETURN_DAYS dias ou mais (ou
 * vence nos próximos dias) e que não têm nenhum atendimento futuro marcado.
 * Ordenadas da mais atrasada para a menos.
 */
export function clientsToCall(clients, appointments, today = toISODate()) {
  const lastVisit = new Map()
  const hasUpcoming = new Set()
  for (const a of appointments) {
    if (a.done) {
      const prev = lastVisit.get(a.clientId)
      if (!prev || a.date > prev.date) lastVisit.set(a.clientId, a)
    } else if (a.date >= today) {
      hasUpcoming.add(a.clientId)
    }
  }

  const from = addDays(today, -(RETURN_DAYS - RETURN_WARNING_DAYS))
  return clients
    .map((client) => ({ client, last: lastVisit.get(client.id) }))
    .filter(({ client, last }) => last && last.date <= from && !hasUpcoming.has(client.id))
    .map(({ client, last }) => {
      const days = daysBetween(last.date, today)
      return {
        client,
        last,
        days,
        overdue: days - RETURN_DAYS, // > 0 atrasada; <= 0 vence em -overdue dias
      }
    })
    .sort((a, b) => b.days - a.days)
}
