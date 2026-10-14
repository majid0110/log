import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from './Logo'

export default function Auth() {
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
          setMessage('Account created. Check your email to confirm it, then sign in.')
          setMode('in')
        }
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <Logo size={64} />
        <h1>Dayline</h1>
        <p className="muted">Your own record of the days you worked.</p>
        <form onSubmit={submit}>
          <label>
            Email
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
            Password
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
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create my account'}
          </button>
        </form>
        <button className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMessage(null) }}>
          {mode === 'in' ? 'First time? Create your account' : 'I already have an account'}
        </button>
      </div>
    </main>
  )
}
