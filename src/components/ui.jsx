import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useEffect } from 'react'
import { initials } from '../lib/format'

export function PageHeader({ title, subtitle, right }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/logo.png"
          alt="Ana Nails"
          className="size-11 shrink-0 rounded-full bg-white p-0.5 ring-2 ring-primary/70 shadow-[0_8px_20px_rgba(139,90,83,0.2)]"
        />
        <div className="min-w-0">
          <h1 className="text-xl leading-tight text-primary truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  )
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-card bg-surface shadow-card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Fab({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed z-30 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[max(1.25rem,calc(50vw-15rem))] grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-light text-on-primary shadow-fab transition active:scale-95"
    >
      <Plus size={28} strokeWidth={2.4} />
    </button>
  )
}

// Conta sheets abertos para só liberar o scroll quando o último fechar
// (a ficha da cliente pode abrir o atendimento por cima).
let openSheets = 0

export function Sheet({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    openSheets += 1
    document.body.style.overflow = 'hidden'
    return () => {
      openSheets -= 1
      if (openSheets === 0) document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(60,35,30,0.55)] animate-[fade-up_0.2s_ease-out_both]"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-bg animate-sheet">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line" />
          <h2 className="pt-3 text-lg text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="mt-3 grid size-9 place-items-center rounded-full bg-surface text-primary"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15'

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-primary text-on-primary active:bg-primary-light',
    outline: 'border-2 border-primary text-primary active:bg-soft',
    danger: 'border-2 border-red-400/60 text-red-500 active:bg-red-50/10',
    ghost: 'text-primary active:bg-soft',
  }
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-display font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr rounded-full bg-surface p-1 shadow-card">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full py-2 text-sm font-display font-semibold transition ${
            value === o.value ? 'bg-primary text-on-primary' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({ label, onPrev, onNext, onLabelClick }) {
  return (
    <div className="flex items-center justify-between rounded-full bg-surface p-1 shadow-card">
      <button type="button" onClick={onPrev} aria-label="Anterior" className="grid size-9 place-items-center rounded-full text-primary active:bg-soft">
        <ChevronLeft size={20} />
      </button>
      <button type="button" onClick={onLabelClick} className="font-display text-sm font-semibold capitalize text-primary">
        {label}
      </button>
      <button type="button" onClick={onNext} aria-label="Próximo" className="grid size-9 place-items-center rounded-full text-primary active:bg-soft">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 grid size-14 place-items-center rounded-full bg-surface text-primary-light shadow-card">
        <Icon size={26} />
      </div>
      <p className="font-display font-semibold text-primary">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
    </div>
  )
}

export function Avatar({ name }) {
  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-soft font-display text-sm font-semibold text-primary">
      {initials(name)}
    </div>
  )
}

/** Lucide não tem ícones de marca; SVG oficial simplificado do WhatsApp. */
export function WhatsAppIcon({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.79.7.69 5.8.69 12.06c0 2 .52 3.95 1.52 5.67L.6 23.3l5.7-1.5a11.33 11.33 0 0 0 5.75 1.47h.01c6.26 0 11.36-5.1 11.36-11.37a11.3 11.3 0 0 0-3.33-8.04z" />
    </svg>
  )
}

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <img src="/logo.png" alt="Ana Nails" className="size-20 animate-pulse rounded-full bg-white p-2" />
    </div>
  )
}
