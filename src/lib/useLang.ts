import { useSyncExternalStore } from 'react'
import { getLang, subscribeLang, type Lang } from './i18n'

/** Re-renders the component that calls it whenever the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang)
}
