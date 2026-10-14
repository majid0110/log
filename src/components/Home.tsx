import { useState } from 'react'
import type { Entry } from '../lib/data'
import { monthKey, monthTitle, parseISO, timeOf, todayISO } from '../lib/dates'
import { IconCheck } from './Icons'

interface Props {
  entries: Entry[]
  onMarkToday: () => Promise<void>
}

export default function Home({ entries, onMarkToday }: Props) {
  const [busy, setBusy] = useState(false)
  const today = todayISO()
  const todays = entries.find((e) => e.work_date === today)
  const thisMonth = monthKey(today)
  const monthCount = entries.filter((e) => monthKey(e.work_date) === thisMonth).length

  const tap = async () => {
    if (busy || todays) return
    setBusy(true)
    try {
      await onMarkToday()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="home">
      <div className="hero card">
        <p className="eyebrow">{parseISO(today).toLocaleDateString(undefined, { weekday: 'long' })}</p>
        <h2 className="big-date">
          {parseISO(today).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
        </h2>
        <p className="muted">{monthTitle(thisMonth)}</p>
      </div>

      <button
        className={`worked-btn ${todays ? 'done' : ''}`}
        onClick={tap}
        disabled={busy || Boolean(todays)}
        aria-live="polite"
      >
        <span className="ring" aria-hidden="true">
          <IconCheck size={44} />
        </span>
        <span className="worked-label">{todays ? 'Recorded for today' : busy ? 'Saving…' : 'I Worked Today'}</span>
        {todays && <span className="worked-sub">Saved at {timeOf(todays.recorded_at)}</span>}
      </button>

      <div className="stats">
        <div className="card stat">
          <span className="stat-num">{monthCount}</span>
          <span className="muted">days worked in {parseISO(today).toLocaleDateString(undefined, { month: 'long' })}</span>
        </div>
        <div className="card stat">
          <span className="stat-num">{entries.length}</span>
          <span className="muted">days recorded in total</span>
        </div>
      </div>
    </section>
  )
}
