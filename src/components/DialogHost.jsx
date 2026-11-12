import { useSyncExternalStore } from 'react'
import { closeDialog, getDialog, subscribe } from '../lib/dialog'
import { Button } from './ui'

/** Desenha o diálogo aberto por confirmDialog()/alertDialog(). Fica acima das fichas. */
export default function DialogHost() {
  const dialog = useSyncExternalStore(subscribe, getDialog)
  if (!dialog) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
      <button
        type="button"
        aria-label="Cancelar"
        onClick={() => closeDialog(false)}
        className="absolute inset-0 bg-[rgba(60,35,30,0.55)] animate-[fade-up_0.2s_ease-out_both]"
      />
      <div className="relative w-full max-w-sm rounded-card bg-bg p-5 shadow-card animate-fade-up">
        <h2 id="dialog-title" className="text-lg text-primary">
          {dialog.title}
        </h2>
        {dialog.message && <p className="mt-2 whitespace-pre-line text-sm text-muted">{dialog.message}</p>}
        <div className="mt-5 flex flex-col gap-2">
          <Button variant={dialog.danger ? 'destructive' : 'primary'} className="w-full" onClick={() => closeDialog(true)}>
            {dialog.confirmLabel}
          </Button>
          {dialog.cancelLabel && (
            <Button variant="ghost" className="w-full" onClick={() => closeDialog(false)}>
              {dialog.cancelLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
