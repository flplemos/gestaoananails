import { useEffect, useState } from 'react'
import { toISODate } from './format'

/**
 * Data de hoje (YYYY-MM-DD) que se atualiza sozinha: o app instalado fica
 * aberto em segundo plano e, sem isso, continuaria mostrando o dia anterior.
 */
export function useToday() {
  const [today, setToday] = useState(toISODate)

  useEffect(() => {
    // Mesmo valor não re-renderiza, então checar com frequência é barato.
    const check = () => setToday(toISODate())
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    const timer = setInterval(check, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
      clearInterval(timer)
    }
  }, [])

  return today
}
