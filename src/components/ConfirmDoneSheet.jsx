import { CalendarCheck, Check, Clock, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useData } from '../context/DataContext'
import { formatBRL, formatDayLabel } from '../lib/format'
import { endTime } from '../lib/schedule'
import { Avatar, Button, Card, Sheet } from './ui'

/**
 * Aberta pelo push "foi concluído?" (/?concluir=<id>): confirma o
 * atendimento com um toque, ou leva para a edição.
 */
export default function ConfirmDoneSheet({ appointment, onClose, onEdit }) {
  const { services, update } = useData()
  const [saving, setSaving] = useState(false)

  const confirmDone = async () => {
    setSaving(true)
    try {
      await update('appointments', appointment.id, { done: true })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={appointment.done ? 'Atendimento concluído' : 'Foi concluído?'}
      footer={
        appointment.done ? (
          <Button className="w-full" onClick={onClose}>
            Ok
          </Button>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" onClick={confirmDone} disabled={saving}>
              <Check size={18} strokeWidth={3} /> {saving ? 'Salvando…' : 'Sim, concluir'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="text-sm" onClick={onEdit}>
                <Pencil size={16} /> Editar
              </Button>
              <Button variant="ghost" className="text-sm" onClick={onClose}>
                Agora não
              </Button>
            </div>
          </div>
        )
      }
    >
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={appointment.clientName} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{appointment.clientName}</p>
          <p className="text-sm text-muted">{appointment.items.map((i) => i.name).join(' + ')}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-primary-light">
            <CalendarCheck size={12} /> {formatDayLabel(appointment.date)}
            <Clock size={12} className="ml-1" /> {appointment.time}–{endTime(appointment, services)}
          </p>
        </div>
        <span className="shrink-0 font-display font-semibold text-primary">{formatBRL(appointment.total)}</span>
      </Card>
      <p className="mt-3 px-1 text-sm text-muted">
        {appointment.done
          ? 'Este atendimento já está marcado como feito e conta no faturamento. ✨'
          : 'Ao concluir, o valor entra no faturamento. Se o valor ou os serviços mudaram, toque em Editar.'}
      </p>
    </Sheet>
  )
}
