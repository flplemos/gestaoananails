import { Bell, BellOff, BellRing, Share, SquarePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { disablePush, enablePush, getPushStatus, testNotification } from '../lib/push'
import { Button, Card } from './ui'

/** Ativa os lembretes push (5h e 3h antes de cada atendimento). */
export default function NotificationsCard() {
  const [status, setStatus] = useState('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPushStatus().then(setStatus, () => setStatus('unsupported'))
  }, [])

  const run = (fn) => async () => {
    setBusy(true)
    try {
      setStatus(await fn())
    } catch (err) {
      console.error(err)
      alert('Não foi possível ativar as notificações. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-4">
      {status === 'install' && (
        <div className="space-y-2 text-sm">
          <p className="font-bold">Para receber os avisos no iPhone, instale o app:</p>
          <ol className="space-y-1.5 text-muted">
            <li className="flex items-center gap-2">
              1. Abra no Safari e toque em <Share size={16} className="text-primary" /> Compartilhar
            </li>
            <li className="flex items-center gap-2">
              2. Escolha <SquarePlus size={16} className="text-primary" /> Adicionar à Tela de Início
            </li>
            <li>3. Abra o app pelo ícone e volte aqui em Ajustes.</li>
          </ol>
        </div>
      )}

      {status === 'unsupported' && (
        <p className="text-sm text-muted">Este navegador não suporta notificações (ou o banco ainda não está conectado).</p>
      )}

      {status === 'denied' && (
        <p className="flex gap-2 text-sm text-muted">
          <BellOff size={18} className="shrink-0 text-primary" />
          As notificações foram bloqueadas. No iPhone: Ajustes › Notificações › Ana Nails › Permitir.
        </p>
      )}

      {status === 'disabled' && (
        <>
          <p className="text-sm text-muted">Receba avisos 5 horas e 3 horas antes de cada atendimento agendado.</p>
          <Button className="mt-3 w-full" disabled={busy} onClick={run(enablePush)}>
            <Bell size={18} /> Ativar lembretes
          </Button>
        </>
      )}

      {status === 'enabled' && (
        <>
          <p className="flex items-center gap-2 text-sm font-bold">
            <BellRing size={18} className="text-primary" /> Lembretes ativos neste aparelho
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" className="px-3 text-sm" disabled={busy} onClick={run(async () => (await testNotification(), 'enabled'))}>
              Testar
            </Button>
            <Button variant="ghost" className="px-3 text-sm" disabled={busy} onClick={run(disablePush)}>
              Desativar
            </Button>
          </div>
        </>
      )}

      {status === 'checking' && <p className="text-sm text-muted">Verificando…</p>}
    </Card>
  )
}
