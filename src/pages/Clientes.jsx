import { CalendarPlus, ChevronRight, HeartHandshake, Pencil, Search, StickyNote, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppointmentSheet from '../components/AppointmentSheet'
import { Avatar, Button, Card, EmptyState, Fab, Field, PageHeader, Sheet, WhatsAppIcon, inputClass } from '../components/ui'
import { useData } from '../context/DataContext'
import { formatBRL, formatPhone, fromISODate, toISODate, whatsappNumber } from '../lib/format'
import { clientsToCall } from '../lib/insights'

const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const closed = { open: false }

export default function Clientes() {
  const { clients, appointments } = useData()
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [edit, setEdit] = useState(closed)
  const [appt, setAppt] = useState(closed)

  const q = normalize(query.trim())
  const list = q ? clients.filter((c) => normalize(c.name).includes(q)) : clients
  const detail = clients.find((c) => c.id === detailId)

  const toCall = useMemo(() => clientsToCall(clients, appointments), [clients, appointments])

  const visits = appointments.reduce((acc, a) => {
    if (a.done) acc[a.clientId] = (acc[a.clientId] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${clients.length} cadastradas`} />
      <div className="space-y-4 px-5">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className={`${inputClass} pl-11 shadow-card`}
            placeholder="Buscar por nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Some durante a busca para não atrapalhar o resultado. */}
        {!q && toCall.length > 0 && <ToCallSection items={toCall} onOpen={setDetailId} />}

        {!q && toCall.length > 0 && (
          <h3 className="-mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">Todas as clientes</h3>
        )}

        {list.length === 0 ? (
          <EmptyState icon={Users} title="Nenhuma cliente encontrada" text={q ? 'Tente outro nome.' : 'Toque no + para cadastrar.'} />
        ) : (
          <Card className="overflow-hidden">
            <ul>
              {list.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-b border-dashed border-line px-4 py-3 last:border-0">
                  <button
                    type="button"
                    onClick={() => setDetailId(c.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Avatar name={c.name} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{c.name}</p>
                      <p className="truncate text-sm text-muted">
                        {c.phone ? formatPhone(c.phone) : 'Sem telefone'} · {visits[c.id] ?? 0} {visits[c.id] === 1 ? 'visita' : 'visitas'}
                      </p>
                    </div>
                  </button>
                  <WhatsAppButton client={c} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Fab label="Nova cliente" onClick={() => setEdit({ open: true, client: null })} />

      <ClientDetailSheet
        client={detail}
        onClose={() => setDetailId(null)}
        onEdit={() => setEdit({ open: true, client: detail })}
        onSchedule={(preset) => setAppt({ open: true, preset })}
        onOpenAppointment={(appointment) => setAppt({ open: true, appointment })}
      />
      <ClientSheet
        key={`edit-${edit.open ? (edit.client?.id ?? 'new') : 'closed'}`}
        open={edit.open}
        client={edit.client}
        onClose={() => setEdit(closed)}
        onDeleted={() => setDetailId(null)}
      />
      <AppointmentSheet
        key={`appt-${appt.open ? (appt.appointment?.id ?? 'new') : 'closed'}`}
        open={appt.open}
        appointment={appt.appointment}
        preset={appt.preset}
        defaultDate={toISODate()}
        onClose={() => setAppt(closed)}
      />
    </>
  )
}

/** Clientes que já deveriam ter voltado (ver clientsToCall). */
function ToCallSection({ items, onOpen }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, 3)

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <HeartHandshake size={14} /> Para chamar ({items.length})
        </h3>
        {items.length > 3 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-bold text-primary">
            {showAll ? 'ver menos' : 'ver todas'}
          </button>
        )}
      </div>
      <Card className="overflow-hidden ring-1 ring-primary/30">
        <ul>
          {visible.map(({ client, last, days, overdue }) => (
            <li key={client.id} className="flex items-center gap-3 border-b border-dashed border-line px-4 py-3 last:border-0">
              <button type="button" onClick={() => onOpen(client.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Avatar name={client.name} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{client.name}</p>
                  <p className="truncate text-xs text-muted">
                    Última visita há {days} dias · {last.items.map((i) => i.name).join(' + ')}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      overdue > 0 ? 'bg-amber-400/20 text-amber-500' : 'bg-soft text-primary'
                    }`}
                  >
                    {overdue > 0
                      ? 'Já deveria ter voltado'
                      : overdue === 0
                        ? 'Deve voltar hoje'
                        : `Deve voltar em ${-overdue} ${overdue === -1 ? 'dia' : 'dias'}`}
                  </span>
                </div>
              </button>
              <WhatsAppButton client={client} />
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

function WhatsAppButton({ client, className = '' }) {
  const wa = whatsappNumber(client.phone)
  if (!wa) return null
  return (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp de ${client.name}`}
      className={`grid size-11 shrink-0 place-items-center rounded-full bg-wpp text-white shadow-[0_6px_15px_rgba(37,211,102,0.3)] transition active:scale-90 active:bg-wpp-hover ${className}`}
    >
      <WhatsAppIcon size={22} />
    </a>
  )
}

const shortDate = (iso) =>
  fromISODate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

/** Ficha da cliente: dados, resumo, histórico de atendimentos e "Agendar próximo". */
function ClientDetailSheet({ client, onClose, onEdit, onSchedule, onOpenAppointment }) {
  const { appointments } = useData()
  if (!client) return null

  const history = appointments.filter((a) => a.clientId === client.id).reverse()
  const done = history.filter((a) => a.done)
  const spent = done.reduce((s, a) => s + Number(a.total), 0)
  const today = toISODate()
  const upcoming = history.filter((a) => !a.done && a.date >= today)
  const last = done[0]

  const schedule = () => {
    const items = last?.items ?? []
    onSchedule({
      clientName: client.name,
      items,
      total: items.reduce((s, i) => s + Number(i.price), 0),
    })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Ficha da cliente"
      footer={
        <Button onClick={schedule} className="w-full">
          <CalendarPlus size={18} /> Agendar próximo
          {last && <span className="font-sans text-xs font-normal opacity-80">(repete o último)</span>}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={client.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold text-primary">{client.name}</p>
            <p className="text-sm text-muted">{client.phone ? formatPhone(client.phone) : 'Sem telefone'}</p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar cliente"
            className="grid size-11 place-items-center rounded-full bg-surface text-primary shadow-card"
          >
            <Pencil size={18} />
          </button>
          <WhatsAppButton client={client} />
        </div>

        {client.notes && (
          <p className="flex gap-2 rounded-2xl bg-soft px-4 py-3 text-sm">
            <StickyNote size={16} className="mt-0.5 shrink-0 text-primary" />
            {client.notes}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Visitas', done.length],
            ['Total gasto', formatBRL(spent)],
            ['Última', last ? shortDate(last.date) : '—'],
          ].map(([label, value]) => (
            <Card key={label} className="px-2 py-3">
              <p className="font-display text-sm font-bold text-primary">{value}</p>
              <p className="text-[11px] text-muted">{label}</p>
            </Card>
          ))}
        </div>

        {upcoming.length > 0 && (
          <HistoryList title="Próximos" items={upcoming.reverse()} onOpen={onOpenAppointment} />
        )}
        {done.length > 0 ? (
          <HistoryList title="Histórico de serviços" items={done} onOpen={onOpenAppointment} />
        ) : (
          <p className="py-4 text-center text-sm text-muted">Nenhum serviço concluído ainda.</p>
        )}
      </div>
    </Sheet>
  )
}

function HistoryList({ title, items, onOpen }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
      <Card className="overflow-hidden">
        <ul>
          {items.map((a) => (
            <li key={a.id} className="border-b border-dashed border-line last:border-0">
              <button type="button" onClick={() => onOpen(a)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <div className="w-14 shrink-0 text-xs font-bold text-primary-light">
                  {shortDate(a.date)}
                  <span className="block font-normal text-muted">{a.time}</span>
                </div>
                <p className="min-w-0 flex-1 text-sm">{a.items.map((i) => i.name).join(' + ')}</p>
                <span className="shrink-0 font-display text-sm font-semibold text-primary">{formatBRL(a.total)}</span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

function ClientSheet({ open, client, onClose, onDeleted }) {
  const { create, update, remove } = useData()
  const [form, setForm] = useState(() => ({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    notes: client?.notes ?? '',
  }))

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = async () => {
    const values = { ...form, name: form.name.trim() }
    if (client) await update('clients', client.id, values)
    else await create('clients', values)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm(`Excluir ${client.name}? Os atendimentos dela continuam no histórico.`)) return
    await remove('clients', client.id)
    onDeleted()
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={client ? 'Editar cliente' : 'Nova cliente'}
      footer={
        <div className="flex gap-3">
          {client && (
            <Button variant="danger" onClick={handleDelete} aria-label="Excluir" className="px-3.5">
              <Trash2 size={18} />
            </Button>
          )}
          <Button onClick={handleSave} disabled={!form.name.trim()} className="flex-1">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nome">
          <input className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome da cliente" />
        </Field>
        <Field label="WhatsApp" hint="Com DDD. O 55 do Brasil é adicionado automaticamente.">
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="84 99999-9999"
          />
        </Field>
        <Field label="Observações">
          <textarea
            className={`${inputClass} min-h-24 resize-none`}
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Preferências, alergias…"
          />
        </Field>
      </div>
    </Sheet>
  )
}
