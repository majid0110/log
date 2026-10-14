import { useMemo } from 'react'
import type { Entry } from '../lib/data'
import { buildCsv, downloadCsv } from '../lib/csv'
import { clock, duration, monthKey, monthTitle, prettyDate, todayISO, weekdayName } from '../lib/dates'
import { IconDownload, IconPlus } from './Icons'

interface Props {
  entries: Entry[]
  onAdd: () => void
  onEdit: (entry: Entry) => void
}

function timesLine(e: Entry): string {
  if (!e.entry_at) return `${weekdayName(e.work_date)} · times missing, tap to add`
  if (!e.exit_at) return `${weekdayName(e.work_date)} · in ${clock(e.entry_at)} · no exit yet`
  const nextDay = e.exit_at.slice(0, 10) !== e.entry_at.slice(0, 10) ? ' (+1)' : ''
  return `${weekdayName(e.work_date)} · ${clock(e.entry_at)} → ${clock(e.exit_at)}${nextDay}`
}

export default function History({ entries, onAdd, onEdit }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of entries) {
      const k = monthKey(e.work_date)
      map.set(k, [...(map.get(k) ?? []), e])
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [entries])

  const thisMonth = monthKey(todayISO())

  return (
    <section>
      <div className="row-actions">
        <button className="btn primary" onClick={onAdd}>
          <IconPlus /> Add missed day
        </button>
      </div>

      <div className="card export">
        <div>
          <strong>Export for Excel</strong>
          <p className="muted">Date, day, entry, exit, hours, lunch, night hours and notes.</p>
        </div>
        <div className="export-btns">
          <button
            className="btn ghost"
            disabled={entries.length === 0}
            onClick={() => downloadCsv(`attendance-${thisMonth}.csv`, buildCsv(entries.filter((e) => monthKey(e.work_date) === thisMonth)))}
          >
            <IconDownload /> This month
          </button>
          <button
            className="btn ghost"
            disabled={entries.length === 0}
            onClick={() => downloadCsv(`attendance-all-${todayISO()}.csv`, buildCsv(entries))}
          >
            <IconDownload /> Everything
          </button>
        </div>
      </div>

      {groups.length === 0 && <p className="empty muted">No days recorded yet. Tap “I Worked Today” on the Today tab.</p>}

      {groups.map(([key, list]) => (
        <div key={key} className="group">
          <h3 className="group-title">
            {monthTitle(key)} <span>{list.length} {list.length === 1 ? 'day' : 'days'}</span>
          </h3>
          <ul className="list">
            {list.map((e, i) => (
              <li key={e.id} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <button className="item card" onClick={() => onEdit(e)}>
                  <span className="item-date">
                    <strong>{prettyDate(e.work_date)}</strong>
                    <span className="muted">{timesLine(e)}</span>
                  </span>
                  {e.paid_minutes != null && (
                    <span className="chips">
                      <span className="chip">{duration(e.paid_minutes)} paid</span>
                      {(e.night_minutes ?? 0) > 0 && <span className="chip night">{duration(e.night_minutes)} night</span>}
                    </span>
                  )}
                  {e.note && <span className="item-note">{e.note}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
