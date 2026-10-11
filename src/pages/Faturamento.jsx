import { ChartColumn, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card, EmptyState, PageHeader, Stepper } from '../components/ui'
import { useData } from '../context/DataContext'
import { MONTHS, formatBRL, monthKey, toISODate } from '../lib/format'

export default function Faturamento() {
  const { appointments, expenses } = useData()
  const [year, setYear] = useState(() => new Date().getFullYear())

  const months = useMemo(() => {
    const prefix = `${year}-`
    const rows = MONTHS.map((name, i) => ({
      key: `${year}-${String(i + 1).padStart(2, '0')}`,
      name,
      revenue: 0,
      expenses: 0,
      count: 0,
    }))
    for (const a of appointments) {
      if (!a.done || !a.date.startsWith(prefix)) continue
      const row = rows[Number(a.date.slice(5, 7)) - 1]
      row.revenue += Number(a.total)
      row.count += 1
    }
    for (const e of expenses) {
      if (!e.date.startsWith(prefix)) continue
      rows[Number(e.date.slice(5, 7)) - 1].expenses += Number(e.amount)
    }
    return rows
      .map((r) => ({ ...r, profit: r.revenue - r.expenses }))
      .filter((r) => r.revenue || r.expenses)
      .reverse()
  }, [appointments, expenses, year])

  const totals = months.reduce(
    (t, m) => ({ revenue: t.revenue + m.revenue, expenses: t.expenses + m.expenses, profit: t.profit + m.profit }),
    { revenue: 0, expenses: 0, profit: 0 },
  )
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue))
  const currentKey = monthKey(toISODate())

  return (
    <>
      <PageHeader title="Faturamento" subtitle="Serviços − despesas" />
      <div className="space-y-4 px-5">
        <Stepper
          label={String(year)}
          onPrev={() => setYear((y) => y - 1)}
          onNext={() => setYear((y) => y + 1)}
          onLabelClick={() => setYear(new Date().getFullYear())}
        />

        <Card className="bg-gradient-to-br from-primary to-primary-light p-5 text-on-primary animate-fade-up">
          <p className="text-sm opacity-85">Lucro líquido em {year}</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight">{formatBRL(totals.profit)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="opacity-80" />
              <div>
                <p className="opacity-75">Serviços</p>
                <p className="font-display font-semibold">{formatBRL(totals.revenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="opacity-80" />
              <div>
                <p className="opacity-75">Despesas</p>
                <p className="font-display font-semibold">{formatBRL(totals.expenses)}</p>
              </div>
            </div>
          </div>
        </Card>

        {months.length === 0 ? (
          <EmptyState icon={ChartColumn} title={`Sem movimento em ${year}`} />
        ) : (
          <ul className="space-y-3">
            {months.map((m, i) => (
              <li key={m.key} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Card className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base text-primary">
                      {m.name}
                      {m.key === currentKey && (
                        <span className="ml-2 rounded-full bg-soft px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide">
                          atual
                        </span>
                      )}
                    </h3>
                    <p className={`font-display text-lg font-bold ${m.profit < 0 ? 'text-red-500' : 'text-primary'}`}>
                      {formatBRL(m.profit)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-light to-primary"
                      style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>
                      {m.count} atend. · {formatBRL(m.revenue)}
                    </span>
                    <span>− {formatBRL(m.expenses)}</span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
