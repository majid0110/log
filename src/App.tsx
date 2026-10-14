import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configured, supabase } from './lib/supabase'
import {
  checkIn, checkOut, deleteEntry, listEntries, listRates, saveEntry, type Entry, type Rate,
} from './lib/data'
import { currentPeriod, todayISO } from './lib/dates'
import { t } from './lib/i18n'
import { useLang } from './lib/useLang'
import { useSummary } from './lib/hooks'
import Auth from './components/Auth'
import Home from './components/Home'
import CalendarView from './components/CalendarView'
import History from './components/History'
import Salary from './components/Salary'
import EntryModal from './components/EntryModal'
import Logo from './components/Logo'
import { Credit, LangSwitch } from './components/Bits'
import {
  IconCalendar, IconCheck, IconHome, IconList, IconLogout, IconMoon, IconSun, IconWallet,
} from './components/Icons'

type Tab = 'today' | 'calendar' | 'history' | 'salary'
type Modal = { entry?: Entry; date?: string } | null

const readTheme = (): 'dark' | 'light' => {
  try {
    return localStorage.getItem('dayline-theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export default function App() {
  const lang = useLang()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [version, setVersion] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [modal, setModal] = useState<Modal>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1020' : '#f4f6ff')
    try {
      localStorage.setItem('dayline-theme', theme)
    } catch {
      /* private mode: ignore */
    }
  }, [theme])

  useEffect(() => {
    if (!configured) {
      setReady(true)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [e, r] = await Promise.all([listEntries(), listRates()])
      setEntries(e)
      setRates(r)
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('err.load'))
    }
    setVersion((v) => v + 1) // makes every salary figure re-load from the database
  }, [])

  // Load on sign-in, and again whenever the app comes back to the foreground (picks up edits from the other phone).
  useEffect(() => {
    if (!session) {
      setEntries([])
      setRates([])
      return
    }
    void refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [session, refresh])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const period = currentPeriod(todayISO())
  const { summary } = useSummary(period.start, period.end, version)

  /** Runs a save, shows the result as a message, and reports whether it worked. */
  const run = async (action: () => Promise<void>, message: string): Promise<boolean> => {
    try {
      await action()
      await refresh()
      setToast(message)
      return true
    } catch (e) {
      setToast(e instanceof Error ? e.message : t('toast.failed'))
      await refresh()
      return false
    }
  }

  const saveModal = async (date: string, entry: string, exit: string, note: string) => {
    await saveEntry({ id: modal?.entry?.id, date, entry, exit, note })
    await refresh()
    setModal(null)
    setToast(t('toast.saved'))
  }

  const removeModal = async () => {
    if (!modal?.entry) return
    await deleteEntry(modal.entry.id)
    await refresh()
    setModal(null)
    setToast(t('toast.deleted'))
  }

  if (!configured) {
    return (
      <main className="auth">
        <div className="auth-card">
          <Logo size={56} />
          <h1>{t('setup.title')}</h1>
          <p className="muted">
            {t('setup.a')} <code>VITE_SUPABASE_URL</code> {t('setup.and')}{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> {t('setup.b')}
          </p>
          <Credit />
        </div>
      </main>
    )
  }

  if (!ready) return <div className="splash"><Logo size={56} /></div>
  if (!session) return <Auth />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><Logo size={30} /><span>Dayline</span></div>
        <div className="top-actions">
          <LangSwitch />
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('aria.theme')}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button className="icon-btn" onClick={() => void supabase.auth.signOut()} aria-label={t('aria.signOut')}>
            <IconLogout />
          </button>
        </div>
      </header>

      <main className="content" key={tab}>
        {loadError && <p className="notice error" role="alert">{loadError}</p>}
        {tab === 'today' && (
          <Home
            entries={entries}
            rates={rates}
            summary={summary}
            onCheckIn={() => run(checkIn, t('toast.entry'))}
            onCheckOut={(id) => run(() => checkOut(id), t('toast.exit'))}
            onEdit={(entry) => setModal({ entry })}
            onGoSalary={() => setTab('salary')}
          />
        )}
        {tab === 'calendar' && (
          <CalendarView entries={entries} onPickDay={(date, entry) => setModal({ date, entry })} />
        )}
        {tab === 'history' && (
          <History entries={entries} onAdd={() => setModal({})} onEdit={(entry) => setModal({ entry })} />
        )}
        {tab === 'salary' && <Salary rates={rates} version={version} onChanged={refresh} />}
        <Credit />
      </main>

      <nav className="tabbar" aria-label={t('nav.main')}>
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}><IconHome /><span>{t('nav.today')}</span></button>
        <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}><IconCalendar /><span>{t('nav.calendar')}</span></button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}><IconList /><span>{t('nav.history')}</span></button>
        <button className={tab === 'salary' ? 'active' : ''} onClick={() => setTab('salary')}><IconWallet /><span>{t('nav.salary')}</span></button>
      </nav>

      {toast && (
        <div className="toast" role="status"><IconCheck size={18} /> {toast}</div>
      )}

      {modal && (
        <EntryModal
          entry={modal.entry}
          initialDate={modal.date}
          onSave={saveModal}
          onDelete={modal.entry ? removeModal : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
