import { useState } from 'react'
import type { Entry } from '../lib/data'
import { monthGrid, monthKey, monthTitle, shiftMonth, todayISO } from '../lib/dates'
import { t, tp } from '../lib/i18n'
import { useLang } from '../lib/useLang'
import { IconChevron } from './Icons'

interface Props {
  entries: Entry[]
  onPickDay: (iso: string, existing?: Entry) => void
}

export default function CalendarView({ entries, onPickDay }: Props) {
  useLang()
  const today = todayISO()
  const current = monthKey(today)
  const [month, setMonth] = useState(current)
  const byDate = new Map(entries.map((e) => [e.work_date, e]))
  const count = entries.filter((e) => monthKey(e.work_date) === month).length

  return (
    <section>
      <div className="month-bar">
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t('aria.prevMonth')}>
          <IconChevron dir="left" />
        </button>
        <div className="month-title">
          <h2>{monthTitle(month)}</h2>
          <span className="muted">{tp('daysWorked', count)}</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={month >= current}
          aria-label={t('aria.nextMonth')}
        >
          <IconChevron dir="right" />
        </button>
      </div>

      <div className="card calendar">
        {t('cal.dow').split(',').map((w, i) => (
          <span key={i} className="dow">{w}</span>
        ))}
        {monthGrid(month).map((iso, i) => {
          if (!iso) return <span key={`b${i}`} />
          const entry = byDate.get(iso)
          const future = iso > today
          return (
            <button
              key={iso}
              className={`day ${entry ? 'worked' : ''} ${iso === today ? 'today' : ''}`}
              disabled={future}
              onClick={() => onPickDay(iso, entry)}
              aria-label={`${iso}${entry ? t('cal.workedAria') : ''}`}
            >
              {Number(iso.slice(8))}
              {entry?.note && <i className="dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <p className="hint muted">{t('cal.tap')}</p>
    </section>
  )
}
