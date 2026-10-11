/*
 * Duração dos atendimentos e detecção de horários sobrepostos.
 * Cada serviço tem `duration` (minutos), definida pela Ana em Ajustes.
 * O atendimento guarda uma cópia da duração de cada serviço em `items`,
 * então mudar o catálogo depois não altera atendimentos já marcados.
 */

export const DEFAULT_DURATION = 60

/** Opções do seletor de duração: 15 min até 8h. */
export const DURATION_OPTIONS = [
  15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 360, 420, 480,
]

export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const fromMinutes = (min) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** 180 -> "3h", 90 -> "1h30", 45 -> "45 min" */
export const formatDuration = (min) => {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

/**
 * Duração total do atendimento. Itens antigos (sem duração salva) usam a
 * duração atual do serviço no catálogo, ou 1h.
 */
export function appointmentDuration(appointment, services = []) {
  const total = (appointment.items ?? []).reduce((sum, item) => {
    const fromCatalog = services.find((s) => s.id === item.serviceId)?.duration
    return sum + Number(item.duration ?? fromCatalog ?? DEFAULT_DURATION)
  }, 0)
  return total || DEFAULT_DURATION
}

export const endTime = (appointment, services) =>
  fromMinutes(toMinutes(appointment.time) + appointmentDuration(appointment, services))

/** Atendimentos do mesmo dia cujo intervalo cruza com o do candidato. */
export function findConflicts(candidate, appointments, services) {
  if (!candidate.date || !candidate.time) return []
  const start = toMinutes(candidate.time)
  const end = start + appointmentDuration(candidate, services)
  return appointments.filter((a) => {
    if (a.id === candidate.id || a.date !== candidate.date) return false
    const aStart = toMinutes(a.time)
    const aEnd = aStart + appointmentDuration(a, services)
    return start < aEnd && aStart < end
  })
}

export const describeAppointment = (a, services) =>
  `${a.clientName} (${a.items.map((i) => i.name).join(' + ')}) das ${a.time} às ${endTime(a, services)}`
