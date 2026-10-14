import { useState } from 'react'
import type { Entry } from '../lib/data'
import { clock, todayISO } from '../lib/dates'

interface Props {
  entry?: Entry
  initialDate?: string
  onSave: (date: string, entry: string, exit: string, note: string) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export default function EntryModal({ entry, initialDate, onSave, onDelete, onClose }: Props) {
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
          void run(() => onSave(date, inTime, outTime, note))
        }}
      >
        <div className="grab" aria-hidden="true" />
        <h2>{entry ? 'Edit day' : 'Add a day'}</h2>

        <label>
          Date the shift started
          <input type="date" required value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>

        <div className="two">
          <label>
            Entry time
            <input type="time" required value={inTime} onChange={(e) => setInTime(e.target.value)} />
          </label>
          <label>
            Exit time
            <input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
          </label>
        </div>
        {overnight && <p className="notice">The exit is earlier than the entry, so this shift ends the next day.</p>}
        {!outTime && inTime && <p className="muted small">No exit time yet: this day is not counted in your salary until you add one.</p>}

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

        <button className="btn primary wide" disabled={busy || !date || !inTime}>
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
