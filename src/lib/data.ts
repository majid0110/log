import { supabase } from './supabase'
import { addDays, nowLocal } from './dates'
import { t } from './i18n'
import {
  cacheGet, cacheSet, enqueue, isNetworkError, isOffline, isTempId, loadQueue, newTempId, saveQueue, type QueuedAction,
} from './offline'

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
  if (isNetworkError(error)) return new Error(t('err.offline'))
  if (error.code === '23505') return new Error(t('err.duplicate'))
  if (error.code === '23514') return new Error(t('err.exitAfter'))
  if (/column|schema cache|function/i.test(error.message)) return new Error(t('err.needSetup'))
  return new Error(error.message)
}

// ---- Attendance ------------------------------------------------------------

/** Runs a read; keeps a copy for offline use, and falls back to that copy when there is no connection. */
async function withOfflineCopy<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const value = await load()
    cacheSet(key, value)
    return value
  } catch (e) {
    const copy = cacheGet<T>(key)
    if (copy != null && (isOffline() || (e instanceof Error && e.message === t('err.offline')))) return copy
    throw e
  }
}

export async function listEntries(): Promise<Entry[]> {
  return withOfflineCopy('entries', async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select(COLUMNS)
      .order('work_date', { ascending: false })
      .limit(5000)
    if (error) throw explain(error)
    return data as Entry[]
  })
}

async function insertEntry(at: string): Promise<string> {
  const { data, error } = await supabase
    .from('attendance')
    .insert({ work_date: at.slice(0, 10), entry_at: at, source: 'tap' })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

async function updateExit(id: string, at: string): Promise<void> {
  const { error } = await supabase.from('attendance').update({ exit_at: at }).eq('id', id)
  if (error) throw error
}

export type TapResult = 'saved' | 'queued'

/** One tap: records the entry time as now. Without internet it is kept on the phone and sent later. */
export async function checkIn(): Promise<TapResult> {
  const now = nowLocal()
  if (!isOffline() && loadQueue().length === 0) {
    try {
      await insertEntry(now)
      return 'saved'
    } catch (e) {
      if (!isNetworkError(e)) throw explain(e as { code?: string; message: string })
    }
  }
  enqueue({ kind: 'in', tempId: newTempId(), at: now })
  return 'queued'
}

/** One tap: records the exit time as now. Without internet it is kept on the phone and sent later. */
export async function checkOut(id: string): Promise<TapResult> {
  const now = nowLocal()
  if (!isTempId(id) && !isOffline() && loadQueue().length === 0) {
    try {
      await updateExit(id, now)
      return 'saved'
    } catch (e) {
      if (!isNetworkError(e)) throw explain(e as { code?: string; message: string })
    }
  }
  enqueue({ kind: 'out', target: id, at: now })
  return 'queued'
}

export interface SyncResult {
  synced: number
  failed: number
  left: number
}

/** Sends taps that were recorded offline, oldest first. Stops at the first connection problem and tries again later. */
export async function syncQueue(): Promise<SyncResult> {
  let queue = loadQueue()
  const result: SyncResult = { synced: 0, failed: 0, left: queue.length }
  if (!queue.length || isOffline()) return result
  const realId = new Map<string, string>()

  while (queue.length) {
    const a: QueuedAction = queue[0]
    try {
      if (a.kind === 'in') {
        try {
          realId.set(a.tempId, await insertEntry(a.at))
        } catch (e) {
          if ((e as { code?: string }).code !== '23505') throw e
          // That day was already recorded (e.g. from the other phone): use the existing record.
          const { data, error } = await supabase.from('attendance').select('id').eq('work_date', a.at.slice(0, 10)).single()
          if (error) throw error
          realId.set(a.tempId, (data as { id: string }).id)
        }
      } else {
        const id = isTempId(a.target) ? realId.get(a.target) : a.target
        if (!id) throw Object.assign(new Error('missing entry'), { code: 'local' })
        await updateExit(id, a.at)
      }
      result.synced++
    } catch (e) {
      if (isNetworkError(e)) break
      result.failed++ // the database refused it; drop it so the queue does not get stuck
    }
    queue = queue.slice(1)
    // Later actions that point at this offline entry now point at the real id.
    queue = queue.map((q) => (q.kind === 'out' && realId.has(q.target) ? { ...q, target: realId.get(q.target)! } : q))
    saveQueue(queue)
  }
  result.left = queue.length
  return result
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
  return withOfflineCopy('rates', async () => {
    const { data, error } = await supabase
      .from('rates')
      .select('month, hourly_rate, currency')
      .order('month', { ascending: false })
    if (error) throw explain(error)
    return (data as Rate[]).map((r) => ({ ...r, hourly_rate: Number(r.hourly_rate) }))
  })
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
  return withOfflineCopy(`summary:${from}:${to}`, () => loadSummary(from, to))
}

async function loadSummary(from: string, to: string): Promise<Summary> {
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
