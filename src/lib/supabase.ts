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

/**
 * Password reset: Supabase's email link opens the site with
 * "#access_token=…&refresh_token=…&type=recovery" (or "#error=…" if the link expired).
 * Signs in with that one-time link and removes it from the address bar.
 */
export async function takeRecoveryLink(): Promise<'recovery' | 'expired' | null> {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  if (!hash) return null
  const params = new URLSearchParams(hash)
  const isRecovery = params.get('type') === 'recovery'
  const hasError = params.has('error') || params.has('error_code')
  if (!isRecovery && !hasError) return null

  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  if (hasError) return 'expired'

  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return 'expired'
  const { error } = await supabase.auth.setSession({ access_token, refresh_token })
  return error ? 'expired' : 'recovery'
}

/** Where the reset email should send you back to: this same page. */
export const siteAddress = (): string => window.location.origin + window.location.pathname
