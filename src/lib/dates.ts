// Date helpers. Work dates are plain "YYYY-MM-DD" strings and times are plain local
// "YYYY-MM-DDTHH:MM:SS" strings (no time zone), so nothing shifts between devices.

import { locale, t } from './i18n.ts'

export const pad = (n: number): string => String(n).padStart(2, '0')

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = (): string => toISO(new Date())

/** Current local date and time as "YYYY-MM-DDTHH:MM:SS". */
export const nowLocal = (): string => {
  const d = new Date()
  return `${toISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso: string, n: number): string => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** "2026-10-14" -> "2026-10" */
export const monthKey = (iso: string): string => iso.slice(0, 7)

export const monthTitle = (key: string): string => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' })
}

export const monthName = (key: string): string => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: 'long' })
}

/** A date like "Wednesday" / "среда", in the chosen language. */
export const longWeekday = (d: Date): string => d.toLocaleDateString(locale(), { weekday: 'long' })

/** A date like "14 October" / "14 октября", in the chosen language. */
export const dayAndMonth = (d: Date): string => d.toLocaleDateString(locale(), { day: 'numeric', month: 'long' })

export const shiftMonth = (key: string, delta: number): string => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const weekdayName = (iso: string, style: 'long' | 'short' = 'long'): string =>
  parseISO(iso).toLocaleDateString(locale(), { weekday: style })

export const prettyDate = (iso: string): string =>
  parseISO(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })

/** "2026-10-14T08:02:11" -> "08:02" (empty when there is no time). */
export const clock = (ts: string | null | undefined): string => (ts ? ts.slice(11, 16) : '')

/** Minutes -> "8h 15m". */
export const duration = (min: number | null | undefined): string => {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}${t('unit.h')} ${pad(m)}${t('unit.m')}` : `${m}${t('unit.m')}`
}

/** Minutes -> "8:15" (safe to open in Excel in any language). */
export const hm = (min: number | null | undefined): string =>
  min == null ? '' : `${Math.floor(min / 60)}:${pad(min % 60)}`

/** Last day of a "YYYY-MM" month as "YYYY-MM-DD". */
export const monthEnd = (key: string): string => {
  const [y, m] = key.split('-').map(Number)
  return `${key}-${pad(new Date(y, m, 0).getDate())}`
}

export interface Period {
  start: string
  end: string
  label: string
  second: boolean
}

/** The two pay periods of a month: 1-15 and 16-end. */
export const periodsOf = (key: string): [Period, Period] => {
  const end = monthEnd(key)
  return [
    { start: `${key}-01`, end: `${key}-15`, label: '1–15', second: false },
    { start: `${key}-16`, end, label: `16–${Number(end.slice(8))}`, second: true },
  ]
}

export const currentPeriod = (iso: string): Period => {
  const [first, second] = periodsOf(monthKey(iso))
  return Number(iso.slice(8)) <= 15 ? first : second
}

/** Cells for a Monday-first month grid; null = empty leading cell. */
export const monthGrid = (key: string): (string | null)[] => {
  const [y, m] = key.split('-').map(Number)
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${key}-${pad(d)}`)
  return cells
}
