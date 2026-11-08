import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { useLang } from '../lib/useLang'
import Logo from './Logo'
import { Credit, LangSwitch } from './Bits'

/** Shown after opening the reset link from the email: you are signed in and choose a new password. */
export default function NewPassword({ onDone }: { onDone: () => void }) {
  useLang()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== repeat) {
      setMessage(t('auth.mismatch'))
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      onDone()
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
        <h1>{t('auth.newTitle')}</h1>
        <form onSubmit={submit}>
          <label>
            {t('auth.newPassword')}
            <input type="password" autoComplete="new-password" minLength={8} required autoFocus
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label>
            {t('auth.repeatPassword')}
            <input type="password" autoComplete="new-password" minLength={8} required
              value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          </label>
          {message && <p className="notice" role="status">{message}</p>}
          <button className="btn primary wide" disabled={busy}>{busy ? t('auth.wait') : t('auth.saveNew')}</button>
        </form>
        <Credit />
      </div>
    </main>
  )
}
