import { CalendarHeart, Check, Clock } from 'lucide-react'
import { useState } from 'react'
import AppointmentSheet from '../components/AppointmentSheet'
import { Avatar, Card, Fab, PageHeader, Stepper } from '../components/ui'
import { useData } from '../context/DataContext'
import { addDays, formatBRL, formatDayLabel, formatLongDate, toISODate } from '../lib/format'

export default function Hoje() {
  const { appointments, update } = useData()
  const [date, setDate] = useState(toISODate)
  const [sheet, setSheet] = useState({ open: false, appointment: null })

  const dayList = appointments.filter((a) => a.date === date)
  const earned = dayList.filter((a) => a.done).reduce((s, a) => s + Number(a.total), 0)
  const expected = dayList.reduce((s, a) => s + Number(a.total), 0)
  const doneCount = dayList.filter((a) => a.done).length

  const toggleDone = (a) => {
    if (a.done && !confirm(`Voltar o atendimento de ${a.clientName} para "agendado"?`)) return
    update('appointments', a.id, { done: !a.done })
  }

  return (
    <>
      <PageHeader title="Olá, Ana ✨" subtitle={formatLongDate(date)} />

      <div className="space-y-4 px-5">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-light p-5 text-on-primary animate-fade-up">
          <p className="text-sm opacity-85">Faturamento de {formatDayLabel(date).toLowerCase()}</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight">{formatBRL(earned)}</p>
          <div className="mt-4 flex gap-5 text-sm">
            <div>
              <p className="opacity-75">Previsto</p>
              <p className="font-display font-semibold">{formatBRL(expected)}</p>
            </div>
            <div>
              <p className="opacity-75">Atendimentos</p>
              <p className="font-display font-semibold">
                {doneCount}/{dayList.length}
              </p>
            </div>
          </div>
          <img src="/logo.png" alt="" className="pointer-events-none absolute -right-6 -bottom-8 size-36 opacity-15 invert brightness-200" />
        </Card>

        <Stepper
          label={formatDayLabel(date)}
          onPrev={() => setDate((d) => addDays(d, -1))}
          onNext={() => setDate((d) => addDays(d, 1))}
          onLabelClick={() => setDate(toISODate())}
        />

        {dayList.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <CalendarHeart className="mb-3 text-primary-light" size={32} />
              <p className="font-display font-semibold text-primary">Nenhum atendimento</p>
              <p className="mt-1 text-sm text-muted">Toque no + para registrar um atendimento.</p>
            </div>
          </Card>
        ) : (
          <ul className="space-y-3">
            {dayList.map((a, i) => (
              <li key={a.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Card className="flex items-center gap-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => setSheet({ open: true, appointment: a })}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Avatar name={a.clientName} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-bold ${a.done ? '' : 'text-ink'}`}>{a.clientName}</p>
                      <p className="truncate text-sm text-muted">{a.items.map((it) => it.name).join(' + ')}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary-light">
                        <Clock size={12} /> {a.time} · {formatBRL(a.total)}
                      </p>
                    </div>
                  </button>
                  {/* Rótulo explícito: o círculo sozinho não deixava claro que significava "concluído". */}
                  <button
                    type="button"
                    onClick={() => toggleDone(a)}
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
        )}
      </div>

      <Fab label="Novo atendimento" onClick={() => setSheet({ open: true, appointment: null })} />
      <AppointmentSheet
        key={sheet.open ? (sheet.appointment?.id ?? 'new') : 'closed'}
        open={sheet.open}
        appointment={sheet.appointment}
        defaultDate={date}
        onClose={() => setSheet({ open: false, appointment: null })}
      />
    </>
  )
}
