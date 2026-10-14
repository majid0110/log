// Date helpers. Work dates are plain "YYYY-MM-DD" strings in the device's local time,
// so a day never shifts because of time zones.

export const pad = (n: number): string => String(n).padStart(2, '0')

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = (): string => toISO(new Date())

export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "2026-10-14" -> "2026-10" */
export const monthKey = (iso: string): string => iso.slice(0, 7)

export const monthTitle = (key: string): string => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export const shiftMonth = (key: string, delta: number): string => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const weekdayName = (iso: string, style: 'long' | 'short' = 'long'): string =>
  parseISO(iso).toLocaleDateString(undefined, { weekday: style })

export const prettyDate = (iso: string): string =>
  parseISO(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export const timeOf = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

/** Cells for a Monday-first month grid; null = empty leading cell. */
export const monthGrid = (key: string): (string | null)[] => {
  const [y, m] = key.split('-').map(Number)
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${key}-${pad(d)}`)
  return cells
}
