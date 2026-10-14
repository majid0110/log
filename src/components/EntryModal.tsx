import { useState } from 'react'
import type { Entry } from '../lib/data'
import { clock, todayISO } from '../lib/dates'
import { t } from '../lib/i18n'
import { useLang } from '../lib/useLang'

interface Props {
  entry?: Entry
  initialDate?: string
  onSave: (date: string, entry: string, exit: string, note: string) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export default function EntryModal({ entry, initialDate, onSave, onDelete, onClose }: Props) {
  useLang()
  const [date, setDate] = useState(entry?.work_date ?? initialDate ?? todayISO())
  const [inTime, setInTime] = useState(clock(entry?.entry_at))
  const [outTime, setOutTime] = useState(clock(entry?.exit_at))
  const [note, setNote] = useState(entry?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const overnight = Boolean(inTime && outTime && outTime <= inTime)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setBusy(false)
    }
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          void run(() => onSave(date, inTime, outTime, note))
        }}
      >
        <div className="grab" aria-hidden="true" />
        <h2>{entry ? t('modal.edit') : t('modal.add')}</h2>

        <label>
          {t('modal.date')}
          <input type="date" required value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>

        <div className="two">
          <label>
            {t('modal.entry')}
            <input type="time" required value={inTime} onChange={(e) => setInTime(e.target.value)} />
          </label>
          <label>
            {t('modal.exit')}
            <input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
          </label>
        </div>
        {overnight && <p className="notice">{t('modal.overnight')}</p>}
        {!outTime && inTime && <p className="muted small">{t('modal.noExit')}</p>}

        <label>
          {t('modal.note')}
          <textarea
            rows={3}
            maxLength={300}
            placeholder={t('modal.notePh')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {error && <p className="notice error" role="alert">{error}</p>}

        <button className="btn primary wide" disabled={busy || !date || !inTime}>
          {busy ? t('common.saving') : t('common.save')}
        </button>

        {entry && onDelete && (
          confirmDelete ? (
            <button type="button" className="btn danger wide" disabled={busy} onClick={() => void run(onDelete)}>
              {t('modal.confirmDelete')}
            </button>
          ) : (
            <button type="button" className="btn ghost wide" disabled={busy} onClick={() => setConfirmDelete(true)}>
              {t('common.delete')}
            </button>
          )
        )}
        <button type="button" className="link" onClick={onClose}>{t('common.cancel')}</button>
      </form>
    </div>
  )
}
