import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { useLang } from '../lib/useLang'
import Logo from './Logo'
import { Credit, LangSwitch } from './Bits'

export default function Auth() {
  useLang()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setMessage(t('auth.created'))
          setMode('in')
        }
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <div className="auth-lang"><LangSwitch /></div>
      <div className="auth-card">
        <Logo size={64} />
        <h1>Dayline</h1>
        <p className="muted">{t('app.tagline')}</p>
        <form onSubmit={submit}>
          <label>
            {t('auth.email')}
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            {t('auth.password')}
            <input
              type="password"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {message && <p className="notice" role="status">{message}</p>}
          <button className="btn primary wide" disabled={busy}>
            {busy ? t('auth.wait') : mode === 'in' ? t('auth.signIn') : t('auth.create')}
          </button>
        </form>
        <button className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMessage(null) }}>
          {mode === 'in' ? t('auth.first') : t('auth.have')}
        </button>
        <Credit />
      </div>
    </main>
  )
}
