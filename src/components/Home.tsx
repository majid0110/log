import { useState } from 'react'
import type { Entry, Rate, Summary } from '../lib/data'
import {
  addDays, clock, currentPeriod, dayAndMonth, duration, longWeekday, monthKey, monthName, monthTitle, parseISO, todayISO,
} from '../lib/dates'
import { locale, t, tp } from '../lib/i18n'
import { useTick } from '../lib/hooks'
import { useLang } from '../lib/useLang'
import { Burst, Money } from './Bits'
import { IconCheck } from './Icons'

interface Props {
  entries: Entry[]
  rates: Rate[]
  summary: Summary | null
  onCheckIn: () => Promise<boolean>
  onCheckOut: (id: string) => Promise<boolean>
  onEdit: (entry: Entry) => void
  onGoSalary: () => void
}

const DAY_MS = 24 * 3600 * 1000

export default function Home({ entries, rates, summary, onCheckIn, onCheckOut, onEdit, onGoSalary }: Props) {
  useLang()
  const [busy, setBusy] = useState(false)
  const [burst, setBurst] = useState(0)

  const today = todayISO()
  const thisMonth = monthKey(today)
  const period = currentPeriod(today)

  // A shift that has an entry but no exit, started within the last 24 hours (it may have started yesterday).
  const open = entries.find(
    (e) => e.entry_at && !e.exit_at && Date.now() - new Date(e.entry_at).getTime() < DAY_MS && e.entry_at <= `${addDays(today, 1)}T00:00:00`,
  )
  const todays = entries.find((e) => e.work_date === today)
  const phase: 'in' | 'out' | 'done' = open ? 'out' : todays ? 'done' : 'in'

  const now = useTick(phase === 'out')
  const running = open?.entry_at ? Math.max(0, Math.floor((now - new Date(open.entry_at).getTime()) / 60000)) : 0

  const monthCount = entries.filter((e) => monthKey(e.work_date) === thisMonth).length

  const tap = async () => {
    if (busy || phase === 'done') return
    setBusy(true)
    try {
      const ok = phase === 'in' ? await onCheckIn() : open ? await onCheckOut(open.id) : false
      if (ok) setBurst((b) => b + 1)
    } finally {
      setBusy(false)
    }
  }

  const hasRateThisMonth = rates.some((r) => r.month === `${thisMonth}-01`)
  const carriedRate = rates.find((r) => r.month < `${thisMonth}-01`)

  const label =
    phase === 'in'
      ? busy ? t('common.saving') : t('home.btnIn')
      : phase === 'out'
        ? busy ? t('common.saving') : t('home.btnOut')
        : t('home.btnDone')
  const sub =
    phase === 'in'
      ? t('home.subIn')
      : phase === 'out' && open?.entry_at
        ? t('home.subOut', { time: clock(open.entry_at), dur: duration(running) })
        : todays?.entry_at
          ? `${clock(todays.entry_at)} → ${clock(todays.exit_at)}${todays.worked_minutes != null ? ` · ${duration(todays.worked_minutes)}` : ''}`
          : t('home.subDone')

  const todayDate = parseISO(today)

  return (
    <section className="home stagger">
      <div className="hero card">
        <p className="eyebrow">{longWeekday(todayDate)}</p>
        <h2 className="big-date">{dayAndMonth(todayDate)}</h2>
        <p className="muted">{monthTitle(thisMonth)}</p>
      </div>

      {!hasRateThisMonth && carriedRate && (
        <button className="card banner" onClick={onGoSalary}>
          <strong>{t('home.newMonth')}</strong>
          <span className="muted">
            {t('home.rateStill', { rate: carriedRate.hourly_rate.toLocaleString(locale()), cur: carriedRate.currency })}
          </span>
        </button>
      )}

      <div className="worked-wrap">
        <button
          className={`worked-btn ${phase}`}
          onClick={tap}
          disabled={busy || phase === 'done'}
          aria-live="polite"
        >
          <span className="ring" aria-hidden="true">
            {phase === 'out' ? <span className="stop" /> : <IconCheck size={44} />}
          </span>
          <span className="worked-label">{label}</span>
          <span className="worked-sub">{sub}</span>
        </button>
        {burst > 0 && <Burst key={burst} />}
      </div>

      {open && open.work_date !== today && (
        <button className="link" onClick={() => onEdit(open)}>
          {t('home.openWrong', { date: open.work_date })}
        </button>
      )}

      <div className="stats">
        <div className="card stat">
          <span className="stat-num">{monthCount}</span>
          <span className="muted">{t('home.daysWorked', { month: monthName(thisMonth) })}</span>
        </div>
        <div className="card stat">
          <span className="stat-num">{entries.length}</span>
          <span className="muted">{t('home.daysTotal')}</span>
        </div>
      </div>

      <button className="card pay" onClick={onGoSalary}>
        <span className="muted">{t('home.salarySoFar', { month: monthName(thisMonth), period: period.label })}</span>
        {summary && summary.rate != null ? (
          <>
            <span className="pay-num"><Money value={summary.grand_total} currency={summary.currency} /></span>
            <span className="muted">
              {t('home.paidDays', { dur: duration(summary.paid_minutes), days: tp('days', summary.work_days) })}
            </span>
          </>
        ) : (
          <span className="pay-num small">{summary ? t('home.setRate') : '…'}</span>
        )}
      </button>
    </section>
  )
}
