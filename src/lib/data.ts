import { supabase } from './supabase'
import { addDays, nowLocal } from './dates'
import { t } from './i18n'

export interface Entry {
  id: string
  work_date: string
  entry_at: string | null
  exit_at: string | null
  worked_minutes: number | null
  lunch_minutes: number | null
  paid_minutes: number | null
  night_minutes: number | null
  note: string | null
  source: 'tap' | 'manual'
}

export interface Rate {
  month: string // "YYYY-MM-01"
  hourly_rate: number
  currency: string
}

export interface Summary {
  rate: number | null
  currency: string | null
  work_days: number
  open_days: number
  paid_minutes: number
  night_minutes: number
  base_pay: number
  night_pay: number
  total_pay: number
  bonus: number
  grand_total: number
}

const COLUMNS =
  'id, work_date, entry_at, exit_at, worked_minutes, lunch_minutes, paid_minutes, night_minutes, note, source'

const explain = (error: { code?: string; message: string }): Error => {
  if (error.code === '23505') return new Error(t('err.duplicate'))
  if (error.code === '23514') return new Error(t('err.exitAfter'))
  if (/column|schema cache|function/i.test(error.message)) return new Error(t('err.needSetup'))
  return new Error(error.message)
}

// ---- Attendance ------------------------------------------------------------

export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(COLUMNS)
    .order('work_date', { ascending: false })
    .limit(5000)
  if (error) throw explain(error)
  return data as Entry[]
}

/** One tap: records the entry time as now. */
export async function checkIn(): Promise<void> {
  const now = nowLocal()
  const { error } = await supabase
    .from('attendance')
    .insert({ work_date: now.slice(0, 10), entry_at: now, source: 'tap' })
  if (error) throw explain(error)
}

/** One tap: records the exit time as now. */
export async function checkOut(id: string): Promise<void> {
  const { error } = await supabase.from('attendance').update({ exit_at: nowLocal() }).eq('id', id)
  if (error) throw explain(error)
}

export interface EntryInput {
  id?: string
  date: string
  entry: string // "HH:MM"
  exit: string // "HH:MM" or ""
  note: string
}

/** Add or edit a day. An exit time at or before the entry time means the shift ends the next day. */
export async function saveEntry(input: EntryInput): Promise<void> {
  const entry_at = `${input.date}T${input.entry}:00`
  const exitDate = input.exit && input.exit <= input.entry ? addDays(input.date, 1) : input.date
  const exit_at = input.exit ? `${exitDate}T${input.exit}:00` : null
  const note = input.note.trim() || null

  if (input.id) {
    const { error } = await supabase
      .from('attendance')
      .update({ work_date: input.date, entry_at, exit_at, note })
      .eq('id', input.id)
    if (error) throw explain(error)
  } else {
    const { error } = await supabase
      .from('attendance')
      .insert({ work_date: input.date, entry_at, exit_at, note, source: 'manual' })
    if (error) throw explain(error)
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('attendance').delete().eq('id', id)
  if (error) throw explain(error)
}

// ---- Rates and bonuses -----------------------------------------------------

export async function listRates(): Promise<Rate[]> {
  const { data, error } = await supabase
    .from('rates')
    .select('month, hourly_rate, currency')
    .order('month', { ascending: false })
  if (error) throw explain(error)
  return (data as Rate[]).map((r) => ({ ...r, hourly_rate: Number(r.hourly_rate) }))
}

export async function setRate(monthKey: string, hourlyRate: number, currency: string): Promise<void> {
  const { error } = await supabase
    .from('rates')
    .upsert({ month: `${monthKey}-01`, hourly_rate: hourlyRate, currency: currency.trim() }, { onConflict: 'user_id,month' })
  if (error) throw explain(error)
}

export async function setBonus(periodStart: string, amount: number): Promise<void> {
  const { error } = await supabase
    .from('bonuses')
    .upsert({ period_start: periodStart, amount }, { onConflict: 'user_id,period_start' })
  if (error) throw explain(error)
}

// ---- Salary (calculated in the database) -----------------------------------

export async function getSummary(from: string, to: string): Promise<Summary> {
  const { data, error } = await supabase.rpc('salary_summary', { p_from: from, p_to: to })
  if (error) throw explain(error)
  const row = (data as Record<string, unknown>[])[0]
  const num = (v: unknown): number => Number(v ?? 0)
  return {
    rate: row.rate == null ? null : num(row.rate),
    currency: (row.currency as string | null) ?? null,
    work_days: num(row.work_days),
    open_days: num(row.open_days),
    paid_minutes: num(row.paid_minutes),
    night_minutes: num(row.night_minutes),
    base_pay: num(row.base_pay),
    night_pay: num(row.night_pay),
    total_pay: num(row.total_pay),
    bonus: num(row.bonus),
    grand_total: num(row.grand_total),
  }
}
