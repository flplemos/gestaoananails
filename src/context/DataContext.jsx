import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
  const [data, setData] = useState({ services: [], clients: [], appointments: [], expenses: [], settings: [] })
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

  // Conta gravações para descartar um recarregamento que cruzou com elas.
  const mutations = useRef(0)

  // O app instalado fica dias em segundo plano. Ao voltar (depois de 1 min+),
  // recarrega em silêncio para refletir o que mudou em outro aparelho.
  useEffect(() => {
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      if (!hiddenAt || Date.now() - hiddenAt < 60_000) return
      hiddenAt = 0
      const seen = mutations.current
      repo.loadAll().then(
        (all) => {
          if (seen !== mutations.current) return
          setData(all)
          setStatus('ready')
        },
        (err) => console.error(err), // sem internet: mantém o que já está na tela
      )
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const actions = useMemo(() => {
    const tracked = (promise) => {
      mutations.current += 1
      return promise.catch(fail).finally(() => {
        mutations.current += 1
      })
    }
    const create = async (collection, values) => {
      const row = await tracked(repo.create(collection, values))
      setData((d) => ({ ...d, [collection]: [...d[collection], row] }))
      return row
    }
    const update = async (collection, id, values) => {
      const row = await tracked(repo.update(collection, id, values))
      setData((d) => ({ ...d, [collection]: d[collection].map((r) => (r.id === id ? row : r)) }))
      return row
    }
    const remove = async (collection, id) => {
      await tracked(repo.remove(collection, id))
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

  const value = useMemo(() => {
    // O atendimento guarda uma cópia do nome da cliente. Se ela foi renomeada
    // depois, mostra o nome atual (senão a edição criaria uma cliente duplicada).
    const names = new Map(data.clients.map((c) => [c.id, c.name]))
    const withCurrentName = (a) => {
      const name = names.get(a.clientId)
      return name && name !== a.clientName ? { ...a, clientName: name } : a
    }
    return {
      status,
      services: [...data.services].sort(byName),
      clients: [...data.clients].sort(byName),
      appointments: data.appointments.map(withCurrentName).sort(byTime),
      expenses: [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)),
      // Configurações: uma linha por usuária (ex.: monthlyGoal).
      settings: data.settings?.[0] ?? {},
      saveSettings: (values) =>
        data.settings?.[0]
          ? actions.update('settings', data.settings[0].id, values)
          : actions.create('settings', values),
      ...actions,
    }
  }, [data, status, actions])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useData = () => useContext(DataContext)
