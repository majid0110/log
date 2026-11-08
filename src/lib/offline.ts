// Offline support: taps made without internet wait in a queue on this phone, and the last loaded
// records and salary figures are kept so the app still shows them offline.
// No React or Supabase in this file, so it can be tested on its own.

import type { Entry } from './data.ts'

export type QueuedAction =
  | { kind: 'in'; tempId: string; at: string } // entry time recorded offline
  | { kind: 'out'; target: string; at: string } // exit time; target is a real id or an offline tempId

const QUEUE_KEY = 'dayline-queue'
const CACHE_PREFIX = 'dayline-cache:'

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string | null): void => {
  try {
    if (value == null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* storage blocked: offline features just won't persist */
  }
}

// ---- Queue -----------------------------------------------------------------

export const loadQueue = (): QueuedAction[] => {
  try {
    const v = JSON.parse(read(QUEUE_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export const saveQueue = (q: QueuedAction[]): void => write(QUEUE_KEY, q.length ? JSON.stringify(q) : null)

export const enqueue = (a: QueuedAction): void => saveQueue([...loadQueue(), a])

export const newTempId = (): string => `local-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const isTempId = (id: string): boolean => id.startsWith('local-')

/** Shows queued taps on top of the records loaded from the database (or from the offline copy). */
export function applyQueue(entries: Entry[], queue: QueuedAction[]): Entry[] {
  const out = entries.map((e) => ({ ...e }))
  for (const a of queue) {
    if (a.kind === 'in') {
      const date = a.at.slice(0, 10)
      if (out.some((e) => e.work_date === date)) continue
      out.push({
        id: a.tempId, work_date: date, entry_at: a.at, exit_at: null, worked_minutes: null,
        lunch_minutes: null, paid_minutes: null, night_minutes: null, note: null, source: 'tap',
      })
    } else {
      const e = out.find((x) => x.id === a.target)
      if (e) e.exit_at = a.at
    }
  }
  return out.sort((a, b) => (a.work_date < b.work_date ? 1 : a.work_date > b.work_date ? -1 : 0))
}

// ---- Offline copy of loaded data --------------------------------------------

export function cacheSet(key: string, value: unknown): void {
  write(CACHE_PREFIX + key, JSON.stringify(value))
}

export function cacheGet<T>(key: string): T | null {
  try {
    const v = read(CACHE_PREFIX + key)
    return v == null ? null : (JSON.parse(v) as T)
  } catch {
    return null
  }
}

/** Removes the offline copy (on sign-out), so the next person on this phone sees nothing. */
export function clearCache(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

// ---- Network ---------------------------------------------------------------

export const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

/** True when an error means "no connection" rather than "the database said no". */
export function isNetworkError(error: unknown): boolean {
  if (isOffline()) return true
  const msg = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error)
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed|timed? ?out|connection/i.test(msg)
}
