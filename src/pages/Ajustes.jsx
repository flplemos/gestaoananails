import { Bell, Check, LogOut, Palette, Pencil, Plus, RotateCcw, Sparkles, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import GoalSheet from '../components/GoalSheet'
import NotificationsCard from '../components/NotificationsCard'
import { Button, Card, Field, PageHeader, Sheet, inputClass } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { THEMES } from '../lib/themes'
import { formatBRL } from '../lib/format'
import { DEFAULT_DURATION, DURATION_OPTIONS, formatDuration } from '../lib/schedule'

export default function Ajustes() {
  const { theme, setTheme } = useTheme()
  const { services, reset, settings } = useData()
  const [goalOpen, setGoalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [sheet, setSheet] = useState({ open: false, service: null })

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Personalize o seu app" />
      <div className="space-y-6 px-5">
        <section>
          <h2 className="mb-2 flex items-center gap-2 px-1 text-sm text-primary">
            <Palette size={16} /> Tema de cores
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`relative flex items-center gap-3 rounded-card bg-surface p-3 text-left shadow-card ring-2 transition ${
                  theme === t.id ? 'ring-primary' : 'ring-transparent'
                }`}
              >
                <span className="flex -space-x-2">
                  <span className="size-7 rounded-full border-2 border-white" style={{ background: t.bg }} />
                  <span className="size-7 rounded-full border-2 border-white" style={{ background: t.primary }} />
                </span>
                <span className="font-display text-sm font-semibold">{t.name}</span>
                {theme === t.id && (
                  <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm text-primary">
              <Sparkles size={16} /> Catálogo de serviços
            </h2>
            <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={() => setSheet({ open: true, service: null })}>
              <Plus size={16} /> Adicionar
            </Button>
          </div>
          <Card className="overflow-hidden">
            <ul>
              {services.map((s) => (
                <li key={s.id} className="border-b border-dashed border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => setSheet({ open: true, service: s })}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="flex-1">
                      <span className="block">{s.name}</span>
                      <span className="text-xs text-muted">{formatDuration(Number(s.duration) || DEFAULT_DURATION)}</span>
                    </span>
                    <span className="font-display font-semibold text-primary">{formatBRL(s.price)}</span>
                    <Pencil size={15} className="text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 px-1 text-sm text-primary">
            <Target size={16} /> Meta mensal
          </h2>
          <Card className="overflow-hidden">
            <button type="button" onClick={() => setGoalOpen(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className="flex-1">
                <span className="block">Meta de faturamento</span>
                <span className="text-xs text-muted">Acompanhe em Faturamento › Mês</span>
              </span>
              <span className="font-display font-semibold text-primary">
                {settings.monthlyGoal ? formatBRL(settings.monthlyGoal) : 'Definir'}
              </span>
              <Pencil size={15} className="text-muted" />
            </button>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 px-1 text-sm text-primary">
            <Bell size={16} /> Notificações
          </h2>
          <NotificationsCard />
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm text-primary">{user ? 'Conta' : 'Dados'}</h2>
          <Card className="p-4">
            {user ? (
              <>
                <p className="text-sm text-muted">
                  Conectada como <span className="font-bold text-ink">{user.email}</span>. Seus dados ficam salvos na nuvem.
                </p>
                <Button variant="outline" className="mt-3 w-full" onClick={() => confirm('Sair da conta?') && signOut()}>
                  <LogOut size={16} /> Sair
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">Modo demonstração: os dados ficam salvos só neste aparelho.</p>
                {reset && (
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => confirm('Apagar tudo e restaurar os dados de exemplo?') && reset()}
                  >
                    <RotateCcw size={16} /> Restaurar dados de exemplo
                  </Button>
                )}
              </>
            )}
          </Card>
        </section>

        <p className="pb-2 text-center text-xs text-muted">Ana Nails · Sua autoestima começa nas unhas ✨</p>
      </div>

      {goalOpen && <GoalSheet open onClose={() => setGoalOpen(false)} />}
      <ServiceSheet
        key={sheet.open ? (sheet.service?.id ?? 'new') : 'closed'}
        open={sheet.open} service={sheet.service} onClose={() => setSheet({ open: false, service: null })} />
    </>
  )
}

function ServiceSheet({ open, service, onClose }) {
  const { create, update, remove } = useData()
  const [form, setForm] = useState(() => ({
    name: service?.name ?? '',
    price: service?.price ?? '',
    duration: Number(service?.duration) || DEFAULT_DURATION,
  }))

  const canSave = form.name.trim() && Number(form.price) >= 0 && form.price !== ''

  const handleSave = async () => {
    const values = { name: form.name.trim(), price: Number(form.price), duration: Number(form.duration) }
    if (service) await update('services', service.id, values)
    else await create('services', values)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm(`Excluir "${service.name}" do catálogo?`)) return
    await remove('services', service.id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={service ? 'Editar serviço' : 'Novo serviço'}
      footer={
        <div className="flex gap-3">
          {service && (
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
        <Field label="Nome do serviço">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex.: Blindagem"
          />
        </Field>
        <Field label="Preço (R$)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </Field>
        <Field label="Duração" hint="Usada para avisar quando dois atendimentos se cruzam.">
          <select
            className={inputClass}
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
          >
            {DURATION_OPTIONS.map((min) => (
              <option key={min} value={min}>
                {formatDuration(min)}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Sheet>
  )
}
