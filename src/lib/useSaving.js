import { useRef, useState } from 'react'

/**
 * Trava de "salvando" para botões: `run(fn)` ignora novas chamadas enquanto a
 * anterior não terminou. Usa ref (e não só o estado) porque dois toques
 * seguidos chegam antes de o React redesenhar o botão desabilitado — sem isso
 * o registro era criado em dobro.
 */
export function useSaving() {
  const busy = useRef(false)
  const [saving, setSaving] = useState(false)

  const run = async (fn) => {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    try {
      return await fn()
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return [saving, run]
}
