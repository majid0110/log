import { useState } from 'react'
import type { Entry } from '../lib/data'
import { todayISO } from '../lib/dates'

interface Props {
  entry?: Entry
  initialDate?: string
  onSave: (date: string, note: string) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export default function EntryModal({ entry, initialDate, onSave, onDelete, onClose }: Props) {
  const [date, setDate] = useState(entry?.work_date ?? initialDate ?? todayISO())
  const [note, setNote] = useState(entry?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
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
          void run(() => onSave(date, note))
        }}
      >
        <div className="grab" aria-hidden="true" />
        <h2>{entry ? 'Edit day' : 'Add a day'}</h2>

        <label>
          Date
          <input type="date" required value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label>
          Note (optional)
          <textarea
            rows={3}
            maxLength={300}
            placeholder="e.g. Face scanner showed absent"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {error && <p className="notice error" role="alert">{error}</p>}

        <button className="btn primary wide" disabled={busy || !date}>
          {busy ? 'Saving…' : 'Save'}
        </button>

        {entry && onDelete && (
          confirmDelete ? (
            <button type="button" className="btn danger wide" disabled={busy} onClick={() => void run(onDelete)}>
              Yes, delete this day
            </button>
          ) : (
            <button type="button" className="btn ghost wide" disabled={busy} onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          )
        )}
        <button type="button" className="link" onClick={onClose}>Cancel</button>
      </form>
    </div>
  )
}
