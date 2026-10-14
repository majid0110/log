import { useMemo } from 'react'
import type { Entry } from '../lib/data'
import { buildCsv, downloadCsv } from '../lib/csv'
import { monthKey, monthTitle, prettyDate, timeOf, todayISO, weekdayName } from '../lib/dates'
import { IconDownload, IconPlus } from './Icons'

interface Props {
  entries: Entry[]
  onAdd: () => void
  onEdit: (entry: Entry) => void
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
          <p className="muted">Date, day, time recorded and notes.</p>
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
            {list.map((e) => (
              <li key={e.id}>
                <button className="item card" onClick={() => onEdit(e)}>
                  <span className="item-date">
                    <strong>{prettyDate(e.work_date)}</strong>
                    <span className="muted">{weekdayName(e.work_date)} · {timeOf(e.recorded_at)}{e.source === 'manual' ? ' · added later' : ''}</span>
                  </span>
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
