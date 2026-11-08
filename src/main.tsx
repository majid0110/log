import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { keepStorage } from './lib/supabase'
import './styles.css'

keepStorage()

// Keeps the app on the phone so it opens without internet (only on the published site).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
