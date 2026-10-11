import { addDays, toISODate } from '../lib/format'

/*
 * Dados de demonstração. As datas são relativas a hoje para que as telas
 * "Hoje", "Despesas" e "Faturamento" sempre tenham conteúdo para testar.
 */

export const seedServices = [
  { id: 'svc-tips', name: 'Aplicação de tips', price: 100 },
  { id: 'svc-manut', name: 'Manutenção até 20 dias', price: 80 },
  { id: 'svc-banho', name: 'Banho em gel', price: 80 },
  { id: 'svc-esm-maos', name: 'Somente esmaltação em gel (mãos)', price: 50 },
  { id: 'svc-esm-pes', name: 'Somente esmaltação em gel (pés)', price: 50 },
]

export const seedClients = [
  { id: 'cli-kate', name: 'Kate Bell', phone: '84 98888-1001', notes: 'Prefere tons nude' },
  { id: 'cli-anna', name: 'Anna Haro', phone: '84 98888-1002', notes: '' },
  { id: 'cli-daniel', name: 'Daniela Higgins', phone: '84 98888-1003', notes: '' },
  { id: 'cli-john', name: 'Joana Appleseed', phone: '84 98888-1004', notes: 'Alergia a acetona forte' },
  { id: 'cli-hank', name: 'Helena Zakroff', phone: '84 98888-1005', notes: '' },
  { id: 'cli-david', name: 'Davina Taylor', phone: '84 98888-1006', notes: '' },
]

const svc = (id) => {
  const s = seedServices.find((x) => x.id === id)
  return { serviceId: s.id, name: s.name, price: s.price }
}

const appt = (id, clientId, date, time, serviceIds, done = true) => {
  const client = seedClients.find((c) => c.id === clientId)
  const items = serviceIds.map(svc)
  return {
    id,
    clientId,
    clientName: client.name,
    date,
    time,
    items,
    total: items.reduce((sum, i) => sum + i.price, 0),
    done,
  }
}

export function buildSeed() {
  const today = toISODate()
  const appointments = [
    appt('apt-1', 'cli-kate', today, '10:30', ['svc-tips'], true),
    appt('apt-2', 'cli-anna', today, '16:30', ['svc-manut', 'svc-esm-pes'], false),
  ]
  const expenses = []

  // Histórico dos últimos ~5 meses para o Faturamento.
  const rotation = [
    ['svc-tips'],
    ['svc-manut'],
    ['svc-banho'],
    ['svc-esm-maos', 'svc-esm-pes'],
    ['svc-manut', 'svc-esm-pes'],
  ]
  for (let back = 1, n = 0; back <= 150; back += 2, n++) {
    const date = addDays(today, -back)
    const client = seedClients[n % seedClients.length]
    appointments.push(
      appt(`apt-h${n}`, client.id, date, n % 2 ? '14:00' : '09:30', rotation[n % rotation.length]),
    )
    if (n % 6 === 0) {
      expenses.push({
        id: `exp-h${n}`,
        date,
        description: ['Esmaltes em gel', 'Lixas e palitos', 'Tips e cola', 'Algodão e acetona'][n % 4],
        amount: [120, 35, 90, 28][n % 4],
      })
    }
  }
  expenses.push({ id: 'exp-today', date: today, description: 'Lixas 180/100', amount: 24.9 })

  return { services: seedServices, clients: seedClients, appointments, expenses }
}
