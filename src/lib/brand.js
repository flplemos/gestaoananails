/*
 * Marca do app.
 *
 * O app da Ana é o padrão. A demonstração pública do NailsApp é gerada com
 * VITE_DEMO=true (ver README): marca neutra, faixa de demonstração e tour.
 * Como VITE_DEMO é trocado por uma constante no build, o código da demo nem
 * entra no app da Ana.
 */

export const DEMO = import.meta.env.VITE_DEMO === 'true'

/** Para onde vai o botão "Quero usar" da demonstração. */
export const DEMO_CTA_URL = import.meta.env.VITE_DEMO_CTA_URL || 'https://nailsapp.fl.dev.br/#contato'

export const BRAND = DEMO
  ? {
      name: 'NailsApp',
      owner: 'Júlia',
      logo: '/demo/logo.svg',
      // A marca d'água dos cartões usa o logo da Ana; na demo fica sem.
      watermark: null,
      slogan: 'Agenda, clientes e faturamento para manicure',
      defaultThemeName: 'Clássico',
    }
  : {
      name: 'Ana Nails',
      owner: 'Ana',
      logo: '/logo.png',
      watermark: '/logo.png',
      slogan: 'Sua autoestima começa nas unhas',
      defaultThemeName: 'Ana Nails',
    }
