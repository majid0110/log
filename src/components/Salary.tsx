import { useEffect, useState } from 'react'
import { setBonus, setRate, type Rate } from '../lib/data'
import { duration, monthTitle, periodsOf, shiftMonth, todayISO, monthKey, type Period } from '../lib/dates'
import { useSummary } from '../lib/hooks'
import { Money } from './Bits'
import { IconChevron } from './Icons'

interface Props {
  rates: Rate[]
  version: number
  onChanged: () => Promise<void>
}

const parseAmount = (text: string): number | null => {
  const n = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

function RateCard({ month, rates, onChanged }: { month: string; rates: Rate[]; onChanged: () => Promise<void> }) {
  const exact = rates.find((r) => r.month === `${month}-01`)
  const carried = exact ?? rates.find((r) => r.month < `${month}-01`)
  const [editing, setEditing] = useState(false)
  const [rateText, setRateText] = useState('')
  const [currency, setCurrency] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEditing(false)
    setError(null)
  }, [month])

  const startEdit = () => {
    setRateText(carried ? String(carried.hourly_rate) : '')
    setCurrency(carried?.currency ?? '')
    setEditing(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseAmount(rateText)
    if (value == null) {
      setError('Enter the hourly rate as a number, for example 12.50')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await setRate(month, value, currency)
      await onChanged()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the rate.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card rate">
      <div className="rate-head">
        <div>
          <p className="eyebrow">Hourly rate · {monthTitle(month)}</p>
          {carried ? (
            <p className="rate-num">
              {carried.hourly_rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <small> {carried.currency} / hour</small>
            </p>
          ) : (
            <p className="rate-num none">Not set yet</p>
          )}
          {carried && !exact && <p className="muted small">Carried over from an earlier month. Change it if it is different now.</p>}
        </div>
        {!editing && (
          <button className="btn ghost" onClick={startEdit}>{carried ? 'Change' : 'Set rate'}</button>
        )}
      </div>

      {editing && (
        <form className="rate-form" onSubmit={save}>
          <div className="two">
            <label>
              Rate per hour
              <input inputMode="decimal" autoFocus value={rateText} onChange={(e) => setRateText(e.target.value)} placeholder="0.00" />
            </label>
            <label>
              Currency (optional)
              <input maxLength={8} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="e.g. ₽ or PKR" />
            </label>
          </div>
          <p className="muted small">Applies to {monthTitle(month)} and later months, until you change it again.</p>
          {error && <p className="notice error" role="alert">{error}</p>}
          <div className="two">
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save rate'}</button>
          </div>
        </form>
      )}
    </div>
  )
}

function PeriodCard({ period, month, version, onChanged }: { period: Period; month: string; version: number; onChanged: () => Promise<void> }) {
  const { summary, failed } = useSummary(period.start, period.end, version)
  const [bonusText, setBonusText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (summary) setBonusText(summary.bonus ? String(summary.bonus) : '')
  }, [summary?.bonus]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveBonus = async () => {
    const value = bonusText.trim() === '' ? 0 : parseAmount(bonusText)
    if (value == null) {
      setError('Enter the bonus as a number, or leave it empty.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await setBonus(period.start, value)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the bonus.')
    } finally {
      setBusy(false)
    }
  }

  const cur = summary?.currency
  const title = `${monthTitle(month).split(' ')[0]} ${period.label}`

  return (
    <div className="card period">
      <div className="period-head">
        <h3>{title}</h3>
        <span className="muted small">{period.second ? 'Salary + bonus' : 'Salary'}</span>
      </div>

      {failed && <p className="notice error">Could not load this period. Make sure the latest database setup has been run.</p>}
      {!summary && !failed && <div className="skeleton" />}

      {summary && (
        <>
          <dl className="lines">
            <div><dt>Days worked</dt><dd>{summary.work_days}</dd></div>
            <div><dt>Paid hours (after lunch)</dt><dd>{duration(summary.paid_minutes)}</dd></div>
            <div><dt>Night hours</dt><dd>{duration(summary.night_minutes)}</dd></div>
            <div><dt>Base pay</dt><dd><Money value={summary.base_pay} /></dd></div>
            <div><dt>Night extra (+30%)</dt><dd><Money value={summary.night_pay} /></dd></div>
            {period.second && <div><dt>Bonus</dt><dd><Money value={summary.bonus} /></dd></div>}
          </dl>

          {period.second && (
            <div className="bonus-row">
              <label>
                Bonus (not fixed, type it in)
                <input inputMode="decimal" value={bonusText} onChange={(e) => setBonusText(e.target.value)} placeholder="0.00" />
              </label>
              <button className="btn ghost" onClick={saveBonus} disabled={busy}>{busy ? 'Saving…' : 'Save bonus'}</button>
            </div>
          )}
          {error && <p className="notice error" role="alert">{error}</p>}

          <div className="total">
            <span>{period.second ? 'Total with bonus' : 'Total'}</span>
            <span className="total-num"><Money value={summary.grand_total} currency={cur} /></span>
          </div>

          {summary.rate == null && <p className="notice">Set your hourly rate above to see the pay.</p>}
          {summary.open_days > 0 && (
            <p className="notice">
              {summary.open_days} {summary.open_days === 1 ? 'day has' : 'days have'} an entry time but no exit time, so {summary.open_days === 1 ? 'it is' : 'they are'} not counted yet.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function Salary({ rates, version, onChanged }: Props) {
  const current = monthKey(todayISO())
  const [month, setMonth] = useState(current)
  const [first, second] = periodsOf(month)

  return (
    <section className="stagger">
      <div className="month-bar">
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <IconChevron dir="left" />
        </button>
        <div className="month-title">
          <h2>{monthTitle(month)}</h2>
          <span className="muted">Paid twice a month</span>
        </div>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= current} aria-label="Next month">
          <IconChevron dir="right" />
        </button>
      </div>

      <RateCard month={month} rates={rates} onChanged={onChanged} />
      <PeriodCard period={first} month={month} version={version} onChanged={onChanged} />
      <PeriodCard period={second} month={month} version={version} onChanged={onChanged} />

      <details className="card rules">
        <summary>How pay is calculated</summary>
        <ul>
          <li>Hours are from your entry time to your exit time.</li>
          <li>Unpaid lunch is taken off automatically: 30 min for a shift of up to 8 hours, 45 min for over 8 and under 12 hours, and 60 min for 12 hours or more.</li>
          <li>Hours between 22:00 and 07:00 earn an extra 30% of your hourly rate. Lunch is taken from daytime hours first.</li>
          <li>Pay = paid hours × hourly rate, plus the night extra. The second period adds the bonus you type in.</li>
          <li>Days with an entry time but no exit time are not counted until you add the exit time.</li>
        </ul>
      </details>
    </section>
  )
}
