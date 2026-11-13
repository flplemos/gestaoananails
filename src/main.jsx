import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BRAND, DEMO } from './lib/brand'
import { registerServiceWorker } from './lib/push'

registerServiceWorker()

// Na demonstração, título, nome na tela inicial e manifesto do NailsApp.
if (DEMO) {
  document.title = `${BRAND.name} · demonstração`
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', BRAND.name)
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', '/demo/manifest.webmanifest')
  document.querySelector('link[rel="icon"]')?.setAttribute('href', BRAND.logo)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
