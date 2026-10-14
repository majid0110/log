import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configured = Boolean(url && key)

// Keeps the sign-in on the device. If the browser blocks storage (some private modes),
// it falls back to memory so the site still works for that visit.
const memory = new Map<string, string>()
const storage = {
  getItem: (k: string): string | null => {
    try {
      return window.localStorage.getItem(k)
    } catch {
      return memory.get(k) ?? null
    }
  },
  setItem: (k: string, v: string): void => {
    try {
      window.localStorage.setItem(k, v)
    } catch {
      memory.set(k, v)
    }
  },
  removeItem: (k: string): void => {
    try {
      window.localStorage.removeItem(k)
    } catch {
      memory.delete(k)
    }
  },
}

// The anon key is public by design; Row Level Security (supabase/schema.sql) protects the data.
// persistSession + autoRefreshToken: the session renews itself in the background, so you stay
// signed in until you tap Sign out (or the browser wipes the site's data).
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'dayline-auth',
    storage,
  },
})

/** Asks the browser not to clear this site's saved data (including the sign-in) when it is low on space. */
export const keepStorage = (): void => {
  try {
    void navigator.storage?.persist?.()
  } catch {
    /* not supported: nothing to do */
  }
}
