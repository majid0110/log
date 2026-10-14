import { useMemo } from 'react'
import type { Entry } from '../lib/data'
import { buildCsv, downloadCsv } from '../lib/csv'
import { clock, duration, monthKey, monthTitle, prettyDate, todayISO, weekdayName } from '../lib/dates'
import { t, tp } from '../lib/i18n'
import { useLang } from '../lib/useLang'
import { IconDownload, IconPlus } from './Icons'

interface Props {
  entries: Entry[]
  onAdd: () => void
  onEdit: (entry: Entry) => void
}

function timesLine(e: Entry): string {
  const wd = weekdayName(e.work_date)
  if (!e.entry_at) return t('hist.timesMissing', { wd })
  if (!e.exit_at) return t('hist.noExit', { wd, in: clock(e.entry_at) })
  const next = e.exit_at.slice(0, 10) !== e.entry_at.slice(0, 10) ? ' (+1)' : ''
  return t('hist.times', { wd, in: clock(e.entry_at), out: clock(e.exit_at), next })
}

export default function History({ entries, onAdd, onEdit }: Props) {
  useLang()
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
          <IconPlus /> {t('hist.add')}
        </button>
      </div>

      <div className="card export">
        <div>
          <strong>{t('hist.export')}</strong>
          <p className="muted">{t('hist.exportDesc')}</p>
        </div>
        <div className="export-btns">
          <button
            className="btn ghost"
            disabled={entries.length === 0}
            onClick={() => downloadCsv(`attendance-${thisMonth}.csv`, buildCsv(entries.filter((e) => monthKey(e.work_date) === thisMonth)))}
          >
            <IconDownload /> {t('hist.thisMonth')}
          </button>
          <button
            className="btn ghost"
            disabled={entries.length === 0}
            onClick={() => downloadCsv(`attendance-all-${todayISO()}.csv`, buildCsv(entries))}
          >
            <IconDownload /> {t('hist.everything')}
          </button>
        </div>
      </div>

      {groups.length === 0 && <p className="empty muted">{t('hist.empty')}</p>}

      {groups.map(([key, list]) => (
        <div key={key} className="group">
          <h3 className="group-title">
            {monthTitle(key)} <span>{tp('days', list.length)}</span>
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
                      <span className="chip">{t('hist.paid', { dur: duration(e.paid_minutes) })}</span>
                      {(e.night_minutes ?? 0) > 0 && <span className="chip night">{t('hist.night', { dur: duration(e.night_minutes) })}</span>}
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
