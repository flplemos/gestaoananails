import { AlertCircle, CalendarHeart, Check, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppointmentSheet from '../components/AppointmentSheet'
import ConfirmDoneSheet from '../components/ConfirmDoneSheet'
import { Avatar, Card, Fab, PageHeader, Segmented, Stepper } from '../components/ui'
import { useData } from '../context/DataContext'
import { addDays, formatBRL, formatDayLabel, formatLongDate, fromISODate, toISODate } from '../lib/format'
import { endTime } from '../lib/schedule'

const sum = (list) => list.reduce((s, a) => s + Number(a.total), 0)

const groupByDate = (list) =>
  list.reduce((acc, a) => {
    ;(acc[a.date] ??= []).push(a)
    return acc
  }, {})

export default function Hoje() {
  const { appointments, update } = useData()
  const [mode, setMode] = useState('dia')
  const [date, setDate] = useState(toISODate)
  const [sheet, setSheet] = useState({ open: false, appointment: null })
  // Push "foi concluído?" abre /?concluir=<id>.
  const [params, setParams] = useSearchParams()
  const confirming = appointments.find((a) => a.id === params.get('concluir'))
  const closeConfirm = () => setParams({}, { replace: true })

  const toggleDone = (a) => {
    if (a.done && !confirm(`Voltar o atendimento de ${a.clientName} para "agendado"?`)) return
    update('appointments', a.id, { done: !a.done })
  }
  const openAppointment = (a) => setSheet({ open: true, appointment: a })
  const goToDay = (d) => {
    setDate(d)
    setMode('dia')
  }

  return (
    <>
      <PageHeader title="Olá, Ana ✨" subtitle={formatLongDate(mode === 'dia' ? date : toISODate())} />

      <div className="space-y-4 px-5">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'dia', label: 'Dia' },
            { value: 'agenda', label: 'Agenda' },
          ]}
        />

        {mode === 'dia' ? (
          <DayView
            date={date}
            setDate={setDate}
            list={appointments.filter((a) => a.date === date)}
            onOpen={openAppointment}
            onToggle={toggleDone}
          />
        ) : (
          <AgendaView appointments={appointments} onOpen={openAppointment} onToggle={toggleDone} onDay={goToDay} />
        )}
      </div>

      <Fab label="Novo atendimento" onClick={() => setSheet({ open: true, appointment: null })} />
      <AppointmentSheet
        key={sheet.open ? (sheet.appointment?.id ?? 'new') : 'closed'}
        open={sheet.open}
        appointment={sheet.appointment}
        defaultDate={mode === 'dia' ? date : toISODate()}
        onClose={() => setSheet({ open: false, appointment: null })}
      />
      {confirming && (
        <ConfirmDoneSheet
          appointment={confirming}
          onClose={closeConfirm}
          onEdit={() => {
            closeConfirm()
            openAppointment(confirming)
          }}
        />
      )}
    </>
  )
}

function DayView({ date, setDate, list, onOpen, onToggle }) {
  const done = list.filter((a) => a.done)
  return (
    <>
      <SummaryCard
        label={`Faturamento de ${formatDayLabel(date).toLowerCase()}`}
        value={formatBRL(sum(done))}
        stats={[
          ['Previsto', formatBRL(sum(list))],
          ['Atendimentos', `${done.length}/${list.length}`],
        ]}
      />
      <Stepper
        label={formatDayLabel(date)}
        onPrev={() => setDate((d) => addDays(d, -1))}
        onNext={() => setDate((d) => addDays(d, 1))}
        onLabelClick={() => setDate(toISODate())}
      />
      {list.length === 0 ? (
        <Empty text="Toque no + para registrar um atendimento." />
      ) : (
        <AppointmentList list={list} onOpen={onOpen} onToggle={onToggle} />
      )}
    </>
  )
}

/** Visão geral: tudo que ainda está agendado, do mais próximo ao mais distante. */
function AgendaView({ appointments, onOpen, onToggle, onDay }) {
  const today = toISODate()
  const scheduled = appointments.filter((a) => !a.done)
  // Ficaram para trás sem "Concluir": lembra a Ana de dar baixa (e entrar no faturamento).
  const overdue = scheduled.filter((a) => a.date < today)
  const upcoming = scheduled.filter((a) => a.date >= today)
  const days = Object.entries(groupByDate(upcoming))
  const next = upcoming[0]

  return (
    <>
      <SummaryCard
        label="Próximos atendimentos"
        value={upcoming.length}
        stats={[
          ['Previsto', formatBRL(sum(upcoming))],
          ['Próximo', next ? `${formatDayLabel(next.date)}, ${next.time}` : '—'],
        ]}
      />

      {overdue.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-primary">
            <AlertCircle size={14} /> Pendentes de concluir ({overdue.length})
          </h3>
          <AppointmentList list={overdue} onOpen={onOpen} onToggle={onToggle} showDate />
        </section>
      )}

      {days.length === 0 ? (
        <Empty text="Nenhum atendimento agendado daqui para frente." />
      ) : (
        days.map(([day, list]) => (
          <section key={day}>
            <button
              type="button"
              onClick={() => onDay(day)}
              className="mb-2 flex w-full items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-muted"
            >
              <span className="flex items-center gap-1">
                {formatDayLabel(day)} <ChevronRight size={14} />
              </span>
              <span>
                {list.length} · {formatBRL(sum(list))}
              </span>
            </button>
            <AppointmentList list={list} onOpen={onOpen} onToggle={onToggle} />
          </section>
        ))
      )}
    </>
  )
}

function SummaryCard({ label, value, stats }) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-light p-5 text-on-primary animate-fade-up">
      <p className="text-sm opacity-85">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold tracking-tight">{value}</p>
      <div className="mt-4 flex gap-5 text-sm">
        {stats.map(([k, v]) => (
          <div key={k}>
            <p className="opacity-75">{k}</p>
            <p className="font-display font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <img src="/logo.png" alt="" className="pointer-events-none absolute -right-6 -bottom-8 size-36 opacity-15 invert brightness-200" />
    </Card>
  )
}

function Empty({ text }) {
  return (
    <Card>
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <CalendarHeart className="mb-3 text-primary-light" size={32} />
        <p className="font-display font-semibold text-primary">Nenhum atendimento</p>
        <p className="mt-1 text-sm text-muted">{text}</p>
      </div>
    </Card>
  )
}

function AppointmentList({ list, onOpen, onToggle, showDate = false }) {
  const { services } = useData()
  return (
    <ul className="space-y-3">
      {list.map((a, i) => (
        <li key={a.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <Card className="flex items-center gap-3 p-3.5">
            <button type="button" onClick={() => onOpen(a)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <Avatar name={a.clientName} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{a.clientName}</p>
                <p className="truncate text-sm text-muted">{a.items.map((it) => it.name).join(' + ')}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary-light">
                  <Clock size={12} /> {showDate && `${fromISODate(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · `}
                  {a.time}–{endTime(a, services)} · {formatBRL(a.total)}
                </p>
              </div>
            </button>
            {/* Rótulo explícito: o círculo sozinho não deixava claro que significava "concluído". */}
            <button
              type="button"
              onClick={() => onToggle(a)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 font-display text-xs font-semibold transition active:scale-95 ${
                a.done ? 'bg-primary text-on-primary' : 'border-2 border-primary/60 text-primary'
              }`}
            >
              {a.done ? (
                <>
                  <Check size={14} strokeWidth={3} /> Feito
                </>
              ) : (
                'Concluir'
              )}
            </button>
          </Card>
        </li>
      ))}
    </ul>
  )
}
