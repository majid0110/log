import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { keepStorage } from './lib/supabase'
import './styles.css'

keepStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
