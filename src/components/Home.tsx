import { useEffect, useRef, useState } from 'react'
import type { Entry, Rate, Summary } from '../lib/data'
import {
  addDays, clock, currentPeriod, previousPeriod, dayAndMonth, duration, longWeekday, monthKey, monthName, monthTitle, parseISO, todayISO,
} from '../lib/dates'
import { locale, t, tp } from '../lib/i18n'
import { useSummary, useTick } from '../lib/hooks'
import { useLang } from '../lib/useLang'
import { Burst, Money } from './Bits'
import { IconCheck } from './Icons'
import { chime, tick, unlockSound, vibrate } from '../lib/sound'

interface Props {
  entries: Entry[]
  rates: Rate[]
  summary: Summary | null
  version: number
  onCheckIn: () => Promise<boolean>
  onCheckOut: (id: string) => Promise<boolean>
  onEdit: (entry: Entry) => void
  onGoSalary: () => void
}

const DAY_MS = 24 * 3600 * 1000

export default function Home({ entries, rates, summary, version, onCheckIn, onCheckOut, onEdit, onGoSalary }: Props) {
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

  // The shift closed today (including a night shift that started yesterday and ended this morning).
  const closedToday = entries.find((e) => e.exit_at && (e.work_date === today || e.exit_at.slice(0, 10) === today))
  const payDay = closedToday?.work_date ?? today
  const { summary: daySummary } = useSummary(payDay, payDay, version)
  const last = previousPeriod(today)
  const { summary: lastSummary } = useSummary(last.start, last.end, version)

  const monthCount = entries.filter((e) => monthKey(e.work_date) === thisMonth).length

  const tap = async () => {
    if (busy || phase === 'done') return
    const kind = phase === 'in' ? 'in' : 'out'
    setBusy(true)
    try {
      const ok = kind === 'in' ? await onCheckIn() : open ? await onCheckOut(open.id) : false
      if (ok) {
        setBurst((b) => b + 1)
        chime(kind)
        vibrate(kind === 'in' ? 60 : [40, 60, 40])
      }
    } finally {
      setBusy(false)
    }
  }

  // Press and hold for 1 second, so a touch in the pocket never records anything.
  const HOLD_MS = 1000
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)
  const stopHold = () => {
    if (timer.current != null) window.clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }
  const startHold = (e: React.PointerEvent) => {
    if (busy || phase === 'done' || e.button > 0) return
    unlockSound()
    tick()
    vibrate(15)
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setHolding(false)
      void tap()
    }, HOLD_MS)
  }
  useEffect(() => stopHold, []) // eslint-disable-line react-hooks/exhaustive-deps

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
          className={`worked-btn ${phase}${holding ? ' holding' : ''}`}
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
              e.preventDefault()
              unlockSound()
              void tap()
            }
          }}
          disabled={busy || phase === 'done'}
          aria-live="polite"
        >
          <span className="ring" aria-hidden="true">
            <svg className="hold-ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" />
            </svg>
            {phase === 'out' ? <span className="stop" /> : <IconCheck size={44} />}
          </span>
          <span className="worked-label">{holding ? t('home.keepHolding') : label}</span>
          <span className="worked-sub">{sub}</span>
        </button>
        {burst > 0 && <Burst key={burst} />}
      </div>
      {phase !== 'done' && <p className="hold-hint muted">{t('home.holdHint')}</p>}

      {open && open.work_date !== today && (
        <button className="link" onClick={() => onEdit(open)}>
          {t('home.openWrong', { date: open.work_date })}
        </button>
      )}

      <div className="stats">
        <button className={`card stat money-stat today-pay${closedToday ? ' earned' : ''}`} onClick={onGoSalary}>
          <span className="muted">{t('home.todayPay')}</span>
          {closedToday && closedToday.paid_minutes == null ? (
            <span className="stat-num pending">{t('home.payAfterSync')}</span>
          ) : closedToday && daySummary ? (
            daySummary.rate != null ? (
              <>
                <span className="stat-num"><Money value={daySummary.total_pay} currency={daySummary.currency} /></span>
                <span className="muted small">{duration(closedToday.paid_minutes)}</span>
              </>
            ) : (
              <span className="stat-num pending">{t('home.setRate')}</span>
            )
          ) : (
            <span className="stat-num pending">
              {closedToday ? '…' : phase === 'out' ? t('home.todayPending') : t('home.todayNone')}
            </span>
          )}
        </button>
        <button className="card stat money-stat" onClick={onGoSalary}>
          <span className="muted">{t('home.lastSalary', { month: monthName(monthKey(last.start)), period: last.label })}</span>
          {lastSummary ? (
            lastSummary.rate != null ? (
              <>
                <span className="stat-num"><Money value={lastSummary.grand_total} currency={lastSummary.currency} /></span>
                <span className="muted small">{tp('days', lastSummary.work_days)}</span>
              </>
            ) : (
              <span className="stat-num pending">{t('home.setRate')}</span>
            )
          ) : (
            <span className="stat-num pending">…</span>
          )}
        </button>
      </div>

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
