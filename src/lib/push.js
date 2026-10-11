import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** No iPhone o push só funciona com o app instalado na Tela de Início. */
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW', err))
}

const urlBase64ToUint8Array = (base64) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/**
 * Estado atual: 'unsupported' | 'install' (iOS fora da Tela de Início) |
 * 'denied' | 'enabled' | 'disabled'.
 */
export async function getPushStatus() {
  if (isIOS() && !isStandalone()) return 'install'
  if (!pushSupported() || !VAPID_PUBLIC_KEY || !supabase) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'enabled' : 'disabled'
}

/** Precisa ser chamado a partir de um toque (exigência do iOS). */
export async function enablePush() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return getPushStatus()

  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))

  const { endpoint, keys } = sub.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' })
  if (error) throw error
  return 'enabled'
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  return 'disabled'
}

/** Notificação local, só para conferir que o aparelho exibe os avisos. */
export async function testNotification() {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('⏰ Teste da Ana Nails', {
    body: 'Assim chegarão os avisos 5h e 3h antes de cada atendimento.',
    icon: '/icon-192.png',
  })
}
