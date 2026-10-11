import { AlertTriangle, Check, Clock, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { formatBRL } from '../lib/format'
import {
  DEFAULT_DURATION,
  appointmentDuration,
  describeAppointment,
  endTime,
  findConflicts,
  formatDuration,
} from '../lib/schedule'
import { Button, Field, Segmented, Sheet, inputClass } from './ui'

const nowTime = () => {
  const d = new Date()
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30)
  return d.toTimeString().slice(0, 5)
}

const emptyForm = (date) => ({
  clientName: '',
  phone: '',
  date,
  time: nowTime(),
  items: [],
  total: 0,
  done: false,
})

/**
 * `preset` pré-preenche um novo atendimento (ex.: "Agendar próximo" a partir
 * da ficha da cliente, com os serviços da última visita).
 */
export default function AppointmentSheet({ open, onClose, appointment, defaultDate, preset }) {
  const { services, clients, appointments, create, update, remove } = useData()
  // O componente é remontado (key) a cada abertura, então o estado inicial basta.
  const [form, setForm] = useState(() =>
    appointment ? { ...appointment, phone: '' } : { ...emptyForm(defaultDate), ...preset },
  )
  const [saving, setSaving] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const matchedClient = clients.find(
    (c) => c.name.toLowerCase() === form.clientName.trim().toLowerCase(),
  )
  const suggestions = useMemo(() => {
    const q = form.clientName.trim().toLowerCase()
    if (!q || matchedClient) return []
    return clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4)
  }, [form.clientName, clients, matchedClient])

  const toggleService = (svc) => {
    setForm((f) => {
      const has = f.items.some((i) => i.serviceId === svc.id)
      const items = has
        ? f.items.filter((i) => i.serviceId !== svc.id)
        : [
            ...f.items,
            {
              serviceId: svc.id,
              name: svc.name,
              price: Number(svc.price),
              duration: Number(svc.duration) || DEFAULT_DURATION,
            },
          ]
      // Mudar a seleção recalcula o total a partir do catálogo.
      return { ...f, items, total: items.reduce((s, i) => s + i.price, 0) }
    })
  }

  const canSave = form.clientName.trim() && form.items.length > 0 && form.time && form.date

  const candidate = { ...form, id: appointment?.id }
  const duration = appointmentDuration(candidate, services)
  const conflicts = form.items.length ? findConflicts(candidate, appointments, services) : []

  const handleSave = async () => {
    if (!canSave) return
    if (conflicts.length) {
      const list = conflicts.map((c) => `• ${describeAppointment(c, services)}`).join('\n')
      if (!confirm(`Tem certeza? Esse horário cruza com:\n\n${list}\n\nAgendar mesmo assim?`)) return
    }
    setSaving(true)
    try {
      let client = matchedClient
      if (!client) {
        client = await create('clients', { name: form.clientName.trim(), phone: form.phone, notes: '' })
      }
      const values = {
        clientId: client.id,
        clientName: client.name,
        date: form.date,
        time: form.time,
        items: form.items,
        total: Number(form.total) || 0,
        done: form.done,
      }
      if (appointment) await update('appointments', appointment.id, values)
      else await create('appointments', values)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Excluir este atendimento?')) return
    await remove('appointments', appointment.id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={appointment ? 'Editar atendimento' : 'Novo atendimento'}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Total</p>
            <p className="font-display text-xl font-bold text-primary">{formatBRL(form.total)}</p>
          </div>
          {appointment && (
            <Button variant="danger" onClick={handleDelete} aria-label="Excluir" className="px-3.5">
              <Trash2 size={18} />
            </Button>
          )}
          <Button onClick={handleSave} disabled={!canSave || saving} className="min-w-32">
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Cliente">
          <input
            className={inputClass}
            placeholder="Nome da cliente"
            value={form.clientName}
            onChange={(e) => set({ clientName: e.target.value })}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ clientName: c.name })}
                  className="rounded-full bg-surface px-3 py-1.5 text-sm text-primary shadow-card"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </Field>

        {form.clientName.trim() && !matchedClient && (
          <Field label="WhatsApp (nova cliente)" hint="Opcional — a cliente será salva na sua lista.">
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              placeholder="84 99999-9999"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <input className={inputClass} type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Horário">
            <input className={inputClass} type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
          </Field>
        </div>

        {form.items.length > 0 && form.time && (
          <p className="-mt-1 flex items-center gap-1.5 px-1 text-sm text-muted">
            <Clock size={14} className="text-primary" />
            {form.time} – {endTime(candidate, services)}
            <span className="text-xs">({formatDuration(duration)})</span>
          </p>
        )}

        {conflicts.length > 0 && (
          <div className="flex gap-2 rounded-2xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Horário ocupado</p>
              {conflicts.map((c) => (
                <p key={c.id} className="text-muted">
                  {describeAppointment(c, services)}
                </p>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-bold">Catálogo de serviços</p>
          <ul className="overflow-hidden rounded-card bg-surface shadow-card">
            {services.map((svc) => {
              const selected = form.items.some((i) => i.serviceId === svc.id)
              return (
                <li key={svc.id} className="border-b border-dashed border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${selected ? 'bg-soft' : ''}`}
                  >
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${
                        selected ? 'border-primary bg-primary text-on-primary' : 'border-line'
                      }`}
                    >
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px]">{svc.name}</span>
                      <span className="text-xs text-muted">{formatDuration(Number(svc.duration) || DEFAULT_DURATION)}</span>
                    </span>
                    <span className="font-display font-semibold text-primary">{formatBRL(svc.price)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor cobrado" hint="Ajuste se deu desconto">
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.total}
              onChange={(e) => set({ total: e.target.value })}
            />
          </Field>
          {/* Fora de <label>: um toque no título não pode alternar o status. */}
          <div className="min-w-0">
            <span className="mb-1.5 block text-sm font-bold">Status</span>
            <Segmented
              value={form.done ? 'done' : 'scheduled'}
              onChange={(v) => set({ done: v === 'done' })}
              options={[
                { value: 'scheduled', label: 'Agendado' },
                { value: 'done', label: 'Feito' },
              ]}
            />
            <span className="mt-1 block text-xs text-muted">Lembrete só para agendados</span>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
