import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { localRepo } from '../lib/localRepo'
import { supabase } from '../lib/supabase'
import { supabaseRepo } from '../lib/supabaseRepo'

// Supabase configurado (.env.local / Vercel) → banco na nuvem; senão, modo demonstração.
const repo = supabase ? supabaseRepo : localRepo

const DataContext = createContext(null)

const byTime = (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR')

const fail = (err) => {
  console.error(err)
  alert('Não foi possível salvar. Verifique a internet e tente de novo.')
  throw err
}

export function DataProvider({ children }) {
  const [data, setData] = useState({ services: [], clients: [], appointments: [], expenses: [] })
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    repo.loadAll().then(
      (all) => {
        if (!active) return
        setData(all)
        setStatus('ready')
      },
      (err) => {
        console.error(err)
        if (active) setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [attempt])

  const actions = useMemo(() => {
    const create = async (collection, values) => {
      const row = await repo.create(collection, values).catch(fail)
      setData((d) => ({ ...d, [collection]: [...d[collection], row] }))
      return row
    }
    const update = async (collection, id, values) => {
      const row = await repo.update(collection, id, values).catch(fail)
      setData((d) => ({ ...d, [collection]: d[collection].map((r) => (r.id === id ? row : r)) }))
      return row
    }
    const remove = async (collection, id) => {
      await repo.remove(collection, id).catch(fail)
      setData((d) => ({ ...d, [collection]: d[collection].filter((r) => r.id !== id) }))
    }
    const retry = () => {
      setStatus('loading')
      setAttempt((n) => n + 1)
    }
    // Só existe no modo demonstração.
    const reset = repo.reset
      ? async () => {
          await repo.reset()
          retry()
        }
      : null
    return { create, update, remove, reset, retry }
  }, [])

  const value = useMemo(
    () => ({
      status,
      services: [...data.services].sort(byName),
      clients: [...data.clients].sort(byName),
      appointments: [...data.appointments].sort(byTime),
      expenses: [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)),
      ...actions,
    }),
    [data, status, actions],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useData = () => useContext(DataContext)
