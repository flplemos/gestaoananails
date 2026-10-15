import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Button, Field, Sheet, inputClass } from './ui'

/** Define a meta de faturamento mensal (usada no Faturamento › Mês). */
export default function GoalSheet({ open, onClose }) {
  const { settings, saveSettings } = useData()
  const [value, setValue] = useState(() => settings.monthlyGoal ?? '')
  const [saving, setSaving] = useState(false)

  const save = async (monthlyGoal) => {
    setSaving(true)
    try {
      await saveSettings({ monthlyGoal })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Meta mensal"
      footer={
        <div className="flex gap-3">
          {settings.monthlyGoal != null && (
            <Button variant="danger" aria-label="Remover meta" className="px-3.5" onClick={() => save(null)}>
              <Trash2 size={18} />
            </Button>
          )}
          <Button className="flex-1" disabled={!(Number(value) > 0) || saving} onClick={() => save(Number(value))}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <Field label="Quanto você quer faturar por mês? (R$)" hint="Vale para todos os meses. A barra acompanha o lucro do mês.">
        <input
          className={`${inputClass} font-display text-2xl font-bold text-primary`}
          type="number"
          inputMode="decimal"
          min="0"
          step="50"
          placeholder="2000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
      </Field>
    </Sheet>
  )
}
