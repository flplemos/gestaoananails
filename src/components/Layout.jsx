import { CalendarHeart, ChartColumn, CloudOff, Settings, Users, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Button, Splash } from './ui'

const TABS = [
  { to: '/', label: 'Hoje', icon: CalendarHeart, end: true },
  { to: '/despesas', label: 'Despesas', icon: Wallet },
  { to: '/faturamento', label: 'Faturamento', icon: ChartColumn },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

export default function Layout() {
  const { status, retry } = useData()
  const navigate = useNavigate()

  // Toque numa notificação com o app já aberto: o service worker manda a URL.
  useEffect(() => {
    const sw = navigator.serviceWorker
    if (!sw) return
    const onMessage = (e) => e.data?.type === 'open-url' && navigate(e.data.url)
    sw.addEventListener('message', onMessage)
    return () => sw.removeEventListener('message', onMessage)
  }, [navigate])

  if (status === 'loading') return <Splash />
  if (status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
        <CloudOff size={36} className="text-primary-light" />
        <p className="font-display font-semibold text-primary">Não foi possível carregar os dados</p>
        <p className="text-sm text-muted">Confira a conexão com a internet.</p>
        <Button onClick={retry}>Tentar de novo</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-bg">
      <main className="pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-bold transition ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-7 w-12 place-items-center rounded-full transition ${
                        isActive ? 'bg-soft' : ''
                      }`}
                    >
                      <Icon size={21} strokeWidth={isActive ? 2.3 : 1.8} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
