import { useEffect, useState } from 'react'
import { setBonus, setRate, type Rate } from '../lib/data'
import { duration, monthTitle, periodsOf, shiftMonth, todayISO, monthKey, type Period } from '../lib/dates'
import { locale, t, tp } from '../lib/i18n'
import { useSummary } from '../lib/hooks'
import { useLang } from '../lib/useLang'
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
      setError(t('rate.errNumber'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await setRate(month, value, currency)
      await onChanged()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rate.errSave'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card rate">
      <div className="rate-head">
        <div>
          <p className="eyebrow">{t('rate.title', { month: monthTitle(month) })}</p>
          {carried ? (
            <p className="rate-num">
              {carried.hourly_rate.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <small> {carried.currency} {t('unit.perHour')}</small>
            </p>
          ) : (
            <p className="rate-num none">{t('rate.none')}</p>
          )}
          {carried && !exact && <p className="muted small">{t('rate.carried')}</p>}
        </div>
        {!editing && (
          <button className="btn ghost" onClick={startEdit}>{carried ? t('rate.change') : t('rate.set')}</button>
        )}
      </div>

      {editing && (
        <form className="rate-form" onSubmit={save}>
          <div className="two">
            <label>
              {t('rate.label')}
              <input inputMode="decimal" autoFocus value={rateText} onChange={(e) => setRateText(e.target.value)} placeholder="0.00" />
            </label>
            <label>
              {t('rate.currency')}
              <input maxLength={8} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder={t('rate.currencyPh')} />
            </label>
          </div>
          <p className="muted small">{t('rate.applies', { month: monthTitle(month) })}</p>
          {error && <p className="notice error" role="alert">{error}</p>}
          <div className="two">
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>{t('common.cancel')}</button>
            <button className="btn primary" disabled={busy}>{busy ? t('common.saving') : t('rate.saveBtn')}</button>
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
      setError(t('period.bonusErr'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await setBonus(period.start, value)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('period.bonusSaveErr'))
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
        <span className="muted small">{period.second ? t('period.salaryBonus') : t('period.salary')}</span>
      </div>

      {failed && <p className="notice error">{t('period.failed')}</p>}
      {!summary && !failed && <div className="skeleton" />}

      {summary && (
        <>
          <dl className="lines">
            <div><dt>{t('period.days')}</dt><dd>{summary.work_days}</dd></div>
            <div><dt>{t('period.paidHours')}</dt><dd>{duration(summary.paid_minutes)}</dd></div>
            <div><dt>{t('period.night')}</dt><dd>{duration(summary.night_minutes)}</dd></div>
            <div><dt>{t('period.base')}</dt><dd><Money value={summary.base_pay} /></dd></div>
            <div><dt>{t('period.nightExtra')}</dt><dd><Money value={summary.night_pay} /></dd></div>
            {period.second && <div><dt>{t('period.bonus')}</dt><dd><Money value={summary.bonus} /></dd></div>}
          </dl>

          {period.second && (
            <div className="bonus-row">
              <label>
                {t('period.bonusInput')}
                <input inputMode="decimal" value={bonusText} onChange={(e) => setBonusText(e.target.value)} placeholder="0.00" />
              </label>
              <button className="btn ghost" onClick={saveBonus} disabled={busy}>{busy ? t('common.saving') : t('period.saveBonus')}</button>
            </div>
          )}
          {error && <p className="notice error" role="alert">{error}</p>}

          <div className="total">
            <span>{period.second ? t('period.totalBonus') : t('period.total')}</span>
            <span className="total-num"><Money value={summary.grand_total} currency={cur} /></span>
          </div>

          {summary.rate == null && <p className="notice">{t('period.setRateHint')}</p>}
          {summary.open_days > 0 && <p className="notice">{tp('openDays', summary.open_days)}</p>}
        </>
      )}
    </div>
  )
}

export default function Salary({ rates, version, onChanged }: Props) {
  useLang()
  const current = monthKey(todayISO())
  const [month, setMonth] = useState(current)
  const [first, second] = periodsOf(month)

  return (
    <section className="stagger">
      <div className="month-bar">
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t('aria.prevMonth')}>
          <IconChevron dir="left" />
        </button>
        <div className="month-title">
          <h2>{monthTitle(month)}</h2>
          <span className="muted">{t('salary.paidTwice')}</span>
        </div>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= current} aria-label={t('aria.nextMonth')}>
          <IconChevron dir="right" />
        </button>
      </div>

      <RateCard month={month} rates={rates} onChanged={onChanged} />
      <PeriodCard period={first} month={month} version={version} onChanged={onChanged} />
      <PeriodCard period={second} month={month} version={version} onChanged={onChanged} />

      <details className="card rules">
        <summary>{t('rules.title')}</summary>
        <ul>
          <li>{t('rules.1')}</li>
          <li>{t('rules.2')}</li>
          <li>{t('rules.3')}</li>
          <li>{t('rules.4')}</li>
          <li>{t('rules.5')}</li>
        </ul>
      </details>
    </section>
  )
}
