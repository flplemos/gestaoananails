import { Compass, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEMO_CTA_URL } from '../lib/brand'
import { Button } from './ui'

/*
 * Só existe na demonstração pública (VITE_DEMO=true):
 * • faixa no topo avisando que é uma demonstração, com "Quero usar";
 * • tour curto na primeira visita, apontando o essencial da tela Hoje.
 */

const TOUR_KEY = 'nailsapp:demo-tour'

const STEPS = [
  {
    target: 'resumo',
    title: 'O seu dia num relance',
    text: 'Quanto já entrou hoje, quanto ainda está previsto e quantos atendimentos faltam.',
  },
  {
    target: 'concluir',
    title: 'Terminou? Toque em Concluir',
    text: 'O valor entra no faturamento na hora. Experimente depois do tour.',
  },
  {
    target: 'novo',
    title: 'Agende em segundos',
    text: 'Escolha a cliente e os serviços. Se o horário cruzar com outro atendimento, o app avisa antes de salvar.',
  },
  {
    target: 'aba-faturamento',
    title: 'Quanto sobrou no mês',
    text: 'Faturamento, despesas e lucro por mês e por ano, com uma meta mensal para acompanhar.',
  },
  {
    target: 'aba-clientes',
    title: 'Quem está na hora de voltar',
    text: 'A ficha de cada cliente e a lista de quem passou de 30 dias sem vir, com o WhatsApp a um toque.',
  },
]

const seenTour = () => {
  try {
    return localStorage.getItem(TOUR_KEY) === 'done'
  } catch {
    return false
  }
}

const markTourSeen = () => {
  try {
    localStorage.setItem(TOUR_KEY, 'done')
  } catch {
    /* modo privado: o tour volta a aparecer na próxima visita */
  }
}

export default function DemoChrome() {
  const location = useLocation()
  const navigate = useNavigate()
  const [touring, setTouring] = useState(() => location.pathname === '/' && !seenTour())

  const startTour = () => {
    if (location.pathname !== '/') navigate('/')
    setTouring(true)
  }
  const endTour = useCallback(() => {
    markTourSeen()
    setTouring(false)
  }, [])

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-2 bg-primary px-4 py-2 text-on-primary">
        <p className="min-w-0 flex-1 text-xs leading-snug">
          <b className="font-display">Demonstração</b>
          <span className="block opacity-90">Os testes ficam só neste aparelho.</span>
        </p>
        <button
          type="button"
          onClick={startTour}
          className="grid size-11 shrink-0 place-items-center rounded-full active:bg-black/10"
          aria-label="Ver o tour de novo"
        >
          <Compass size={20} />
        </button>
        <a
          href={DEMO_CTA_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-on-primary px-4 font-display text-sm font-semibold text-primary"
        >
          Quero usar
        </a>
      </div>
      {touring && <Tour onClose={endTour} />}
    </>
  )
}

const PAD = 6
const GAP = 14

function Tour({ onClose }) {
  const [index, setIndex] = useState(0)
  const [steps, setSteps] = useState(null)
  const [rect, setRect] = useState(null)
  const nextRef = useRef(null)

  // Espera a tela Hoje desenhar e usa só os passos cujo alvo existe
  // (ex.: sem atendimento pendente hoje, o passo "Concluir" é pulado).
  useEffect(() => {
    let tries = 0
    const find = () => {
      const available = STEPS.filter((s) => document.querySelector(`[data-tour="${s.target}"]`))
      if (available.length >= 3 || tries > 10) {
        if (available.length) setSteps(available)
        else onClose()
        return
      }
      tries += 1
      timer = setTimeout(find, 150)
    }
    let timer = setTimeout(find, 50)
    return () => clearTimeout(timer)
  }, [onClose])

  const step = steps?.[index]

  const measure = useCallback(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
  }, [step])

  useLayoutEffect(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    // Elementos fixos (botão +, barra de abas) não precisam rolar.
    if (el && getComputedStyle(el).position !== 'fixed' && !el.closest('nav')) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
    // Medir o elemento depois de rolar a tela é exatamente o uso de um layout effect.
    // oxlint-disable-next-line react/set-state-in-effect
    measure()
  }, [step, measure])

  // Foco no botão principal assim que o balão aparece (teclado e leitor de tela).
  const shown = Boolean(rect)
  useEffect(() => {
    if (shown) nextRef.current?.focus()
  }, [shown, index])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [measure, onClose])

  if (!step || !rect) return null

  const last = index === steps.length - 1
  const below = window.innerHeight - (rect.top + rect.height) > 230
  const cardPos = below ? { top: rect.top + rect.height + GAP } : { bottom: window.innerHeight - rect.top + GAP }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Bloqueia toques fora do tour; o destaque escurece o resto da tela. */}
      <div className="absolute inset-0" />
      <div
        className="pointer-events-none fixed rounded-[22px] shadow-[0_0_0_9999px_rgba(20,12,10,0.68)] ring-2 ring-white/80 transition-all duration-200 motion-reduce:transition-none"
        style={rect}
      />
      <div
        className="fixed inset-x-4 mx-auto max-w-sm rounded-card bg-bg p-5 text-ink shadow-card animate-fade-up motion-reduce:animate-none"
        style={cardPos}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold text-muted">
            {index + 1} de {steps.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar o tour"
            className="-m-3 grid size-11 shrink-0 place-items-center rounded-full text-muted"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="tour-title" className="mt-1 text-lg text-primary">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{step.text}</p>
        <div className="mt-4 flex gap-2">
          {index > 0 && (
            <Button variant="ghost" className="px-4" onClick={() => setIndex((i) => i - 1)}>
              Voltar
            </Button>
          )}
          <Button ref={nextRef} className="flex-1" onClick={() => (last ? onClose() : setIndex((i) => i + 1))}>
            {last ? 'Explorar o app' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
