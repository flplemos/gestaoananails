import { Receipt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, EmptyState, Fab, Field, PageHeader, Segmented, Sheet, Stepper, inputClass } from '../components/ui'
import { useData } from '../context/DataContext'
import {
  addDays,
  addMonths,
  formatBRL,
  formatDayLabel,
  formatMonthKey,
  fromISODate,
  monthKey,
  toISODate,
} from '../lib/format'

const QUICK = ['Esmaltes em gel', 'Lixas', 'Tips', 'Algodão', 'Acetona', 'Base/Top coat']

export default function Despesas() {
  const { expenses } = useData()
  const [mode, setMode] = useState('mes')
  const [date, setDate] = useState(toISODate)
  const [sheet, setSheet] = useState({ open: false, expense: null })

  const month = monthKey(date)
  const list = expenses.filter((e) => (mode === 'dia' ? e.date === date : monthKey(e.date) === month))
  const total = list.reduce((s, e) => s + Number(e.amount), 0)

  const step = (dir) => setDate((d) => (mode === 'dia' ? addDays(d, dir) : `${addMonths(monthKey(d), dir)}-01`))

  // Agrupa por dia na visão mensal.
  const groups = list.reduce((acc, e) => {
    ;(acc[e.date] ??= []).push(e)
    return acc
  }, {})

  return (
    <>
      <PageHeader title="Despesas" subtitle="Materiais e gastos" />
      <div className="space-y-4 px-5">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'dia', label: 'Dia' },
            { value: 'mes', label: 'Mês' },
          ]}
        />
        <Stepper
          label={mode === 'dia' ? formatDayLabel(date) : formatMonthKey(month)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onLabelClick={() => setDate(toISODate())}
        />

        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted">Total gasto {mode === 'dia' ? 'no dia' : 'no mês'}</p>
            <p className="font-display text-3xl font-bold text-primary">{formatBRL(total)}</p>
          </div>
          <div className="grid size-12 place-items-center rounded-full bg-soft text-primary">
            <Receipt size={22} />
          </div>
        </Card>

        {list.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhuma despesa" text="Toque no + para registrar um gasto." />
        ) : (
          Object.entries(groups).map(([day, items]) => (
            <section key={day}>
              {mode === 'mes' && (
                <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">
                  {fromISODate(day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </h3>
              )}
              <Card className="overflow-hidden">
                <ul>
                  {items.map((e) => (
                    <li key={e.id} className="border-b border-dashed border-line last:border-0">
                      <button
                        type="button"
                        onClick={() => setSheet({ open: true, expense: e })}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                      >
                        <span className="truncate">{e.description}</span>
                        <span className="shrink-0 font-display font-semibold text-primary">
                          − {formatBRL(e.amount)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))
        )}
      </div>

      <Fab label="Nova despesa" onClick={() => setSheet({ open: true, expense: null })} />
      <ExpenseSheet
        key={sheet.open ? (sheet.expense?.id ?? 'new') : 'closed'}
        open={sheet.open}
        expense={sheet.expense}
        defaultDate={mode === 'mes' && month === monthKey(toISODate()) ? toISODate() : date}
        onClose={() => setSheet({ open: false, expense: null })}
      />
    </>
  )
}

function ExpenseSheet({ open, expense, defaultDate, onClose }) {
  const { create, update, remove } = useData()
  const [form, setForm] = useState(() =>
    expense ? { ...expense } : { description: '', amount: '', date: defaultDate },
  )

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const canSave = form.description.trim() && Number(form.amount) > 0 && form.date

  const handleSave = async () => {
    const values = { description: form.description.trim(), amount: Number(form.amount), date: form.date }
    if (expense) await update('expenses', expense.id, values)
    else await create('expenses', values)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm('Excluir esta despesa?')) return
    await remove('expenses', expense.id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={expense ? 'Editar despesa' : 'Nova despesa'}
      footer={
        <div className="flex gap-3">
          {expense && (
            <Button variant="danger" onClick={handleDelete} aria-label="Excluir" className="px-3.5">
              <Trash2 size={18} />
            </Button>
          )}
          <Button onClick={handleSave} disabled={!canSave} className="flex-1">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Valor (R$)">
          <input
            className={`${inputClass} font-display text-2xl font-bold text-primary`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
            autoFocus
          />
        </Field>
        <Field label="Descrição">
          <input
            className={inputClass}
            placeholder="Ex.: Esmaltes em gel"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => set({ description: q })}
                className="rounded-full bg-surface px-3 py-1.5 text-sm text-primary shadow-card"
              >
                {q}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Data">
          <input className={inputClass} type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
      </div>
    </Sheet>
  )
}
