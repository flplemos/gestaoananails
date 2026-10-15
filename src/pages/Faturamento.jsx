import { CalendarCheck, ChartColumn, Pencil, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import GoalSheet from '../components/GoalSheet'
import { Card, EmptyState, PageHeader, Segmented, Stepper } from '../components/ui'
import { useData } from '../context/DataContext'
import { MONTHS, addMonths, formatBRL, formatMonthKey, monthKey, toISODate } from '../lib/format'
import { monthSummary, yearSummary } from '../lib/insights'

const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3).toLowerCase())

export default function Faturamento() {
  const { appointments, expenses } = useData()
  const [mode, setMode] = useState('mes')
  const [month, setMonth] = useState(() => monthKey(toISODate()))
  const year = Number(month.slice(0, 4))

  const openMonth = (key) => {
    setMonth(key)
    setMode('mes')
  }

  return (
    <>
      <PageHeader title="Faturamento" subtitle="Serviços − despesas" />
      <div className="space-y-4 px-5">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'mes', label: 'Mês' },
            { value: 'ano', label: 'Ano' },
          ]}
        />
        {mode === 'mes' ? (
          <>
            <Stepper
              label={formatMonthKey(month)}
              onPrev={() => setMonth((m) => addMonths(m, -1))}
              onNext={() => setMonth((m) => addMonths(m, 1))}
              onLabelClick={() => setMonth(monthKey(toISODate()))}
            />
            <MonthView month={month} appointments={appointments} expenses={expenses} />
          </>
        ) : (
          <>
            <Stepper
              label={String(year)}
              onPrev={() => setMonth(`${year - 1}${month.slice(4)}`)}
              onNext={() => setMonth(`${year + 1}${month.slice(4)}`)}
              onLabelClick={() => setMonth(monthKey(toISODate()))}
            />
            <YearView year={year} appointments={appointments} expenses={expenses} onMonth={openMonth} />
          </>
        )}
      </div>
    </>
  )
}

function MonthView({ month, appointments, expenses }) {
  const s = useMemo(() => monthSummary(month, appointments, expenses), [month, appointments, expenses])
  const monthName = formatMonthKey(month).split(' ')[0].toLowerCase()
  const prevName = SHORT_MONTHS[Number(s.prevKey.slice(5)) - 1]

  return (
    <>
      <HeroCard
        label={`Lucro de ${monthName}`}
        profit={s.profit}
        change={s.change}
        changeLabel={`vs ${prevName}.${s.partialComparison ? ' até hoje' : ''}`}
        revenue={s.revenue}
        expenses={s.expenses}
      />
      <GoalCard profit={s.profit} />
      <div className="grid grid-cols-3 gap-2">
        <MiniStat value={s.count} label="atendimentos" />
        <MiniStat value={formatBRL(s.ticket).replace(',00', '')} label="ticket médio" />
        <MiniStat value={formatBRL(s.scheduled).replace(',00', '')} label="já agendado" />
      </div>
      <ServicesCard title="Serviços do mês" services={s.services} />
    </>
  )
}

function YearView({ year, appointments, expenses, onMonth }) {
  const s = useMemo(() => yearSummary(year, appointments, expenses), [year, appointments, expenses])
  const max = Math.max(1, ...s.months.map((m) => m.profit))
  const current = monthKey(toISODate())

  if (!s.revenue && !s.expenses) return <EmptyState icon={ChartColumn} title={`Sem movimento em ${year}`} />

  return (
    <>
      <HeroCard
        label={`Lucro em ${year}`}
        profit={s.profit}
        change={s.change}
        changeLabel={`vs ${s.prevYear}${s.partialComparison ? ' até hoje' : ''}`}
        revenue={s.revenue}
        expenses={s.expenses}
      />

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-display font-semibold text-primary">
            <ChartColumn size={14} /> Lucro por mês
          </span>
          <span className="text-muted">toque para abrir</span>
        </div>
        <div className="flex h-28 items-end gap-1">
          {s.months.map((m) => (
            <button
              key={m.key}
              type="button"
              disabled={m.future}
              onClick={() => onMonth(m.key)}
              aria-label={`${MONTHS[m.index]}: ${formatBRL(m.profit)}`}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <span
                className={`block w-full rounded-t-md transition ${
                  m.profit < 0 ? 'bg-red-400/70' : m.key === current ? 'bg-primary' : 'bg-primary/45'
                }`}
                style={{ height: `${Math.max(3, (Math.max(m.profit, 0) / max) * 100)}%`, opacity: m.future ? 0.25 : 1 }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-center text-[10px] text-muted">
          {SHORT_MONTHS.map((name, i) => (
            <span key={name} className={`flex-1 ${s.months[i].key === current ? 'font-bold text-primary' : ''}`}>
              {name[0].toUpperCase()}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card className="px-3 py-2.5">
          <p className="text-[11px] text-muted">melhor mês</p>
          <p className="font-display font-semibold text-primary">{s.best ? MONTHS[s.best.index] : '—'}</p>
          <p className="text-[11px] text-muted">{s.best ? formatBRL(s.best.profit) : ''}</p>
        </Card>
        <Card className="px-3 py-2.5">
          <p className="text-[11px] text-muted">média por mês</p>
          <p className="font-display font-semibold text-primary">{formatBRL(s.average)}</p>
          <p className="text-[11px] text-muted">{s.count} atendimentos</p>
        </Card>
      </div>

      <ServicesCard title="Serviços do ano" services={s.services} />
    </>
  )
}

function HeroCard({ label, profit, change, changeLabel, revenue, expenses }) {
  const Trend = change != null && change < 0 ? TrendingDown : TrendingUp
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-light p-5 text-on-primary animate-fade-up">
      <p className="text-sm opacity-85">{label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="font-display text-4xl font-bold tracking-tight">{formatBRL(profit)}</p>
        {change != null && (
          <span className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">
            <Trend size={13} /> {change > 0 ? '+' : ''}
            {change}% {changeLabel}
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-6 text-sm">
        <div>
          <p className="opacity-75">Serviços</p>
          <p className="font-display font-semibold">{formatBRL(revenue)}</p>
        </div>
        <div>
          <p className="opacity-75">Despesas</p>
          <p className="font-display font-semibold">{formatBRL(expenses)}</p>
        </div>
      </div>
      <img src="/logo.png" alt="" className="pointer-events-none absolute -right-6 -bottom-8 size-36 opacity-15 invert brightness-200" />
    </Card>
  )
}

function GoalCard({ profit }) {
  const { settings } = useData()
  const [open, setOpen] = useState(false)
  const goal = settings.monthlyGoal
  const pct = goal ? Math.min(100, Math.max(0, Math.round((profit / goal) * 100))) : 0

  return (
    <>
      <Card className="p-4">
        <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-display font-semibold text-primary">
              <Target size={15} /> Meta do mês
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              {goal ? `${pct}%` : 'Definir meta'} <Pencil size={12} />
            </span>
          </div>
          {goal ? (
            <>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span>
                  <b>{formatBRL(profit)}</b> <span className="text-muted">de {formatBRL(goal)}</span>
                </span>
                <span className="text-muted">
                  {profit >= goal ? 'Meta batida! 🎉' : `faltam ${formatBRL(goal - profit)}`}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">Toque para definir quanto você quer faturar por mês.</p>
          )}
        </button>
      </Card>
      {open && <GoalSheet open onClose={() => setOpen(false)} />}
    </>
  )
}

function MiniStat({ value, label }) {
  return (
    <Card className="px-1 py-2.5 text-center">
      <p className="font-display font-semibold text-primary">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </Card>
  )
}

function ServicesCard({ title, services }) {
  if (!services.length) {
    return (
      <Card className="flex items-center gap-2 p-4 text-sm text-muted">
        <CalendarCheck size={16} className="text-primary-light" /> Nenhum atendimento concluído no período.
      </Card>
    )
  }
  const max = services[0].revenue || 1
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-muted">
        <Sparkles size={14} /> {title}
      </h3>
      <Card className="space-y-3 p-4 text-sm">
        {services.slice(0, 5).map((svc) => (
          <div key={svc.name}>
            <div className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {svc.name} <span className="text-muted">· {svc.count}x</span>
              </span>
              <span className="shrink-0 font-display font-semibold text-primary">{formatBRL(svc.revenue)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
              <div className="h-full rounded-full bg-primary-light" style={{ width: `${(svc.revenue / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}
