import type { CSSProperties } from 'react'
import { useCountUp } from '../lib/hooks'
import { locale, setLang, t } from '../lib/i18n'
import { useLang } from '../lib/useLang'

/** An amount that counts up smoothly. */
export function Money({ value, currency }: { value: number; currency?: string | null }) {
  const shown = useCountUp(value)
  const text = shown.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <span className="money">
      {text}
      {currency ? <small> {currency}</small> : null}
    </span>
  )
}

/** A small burst of dots, shown for a moment after a successful tap. */
export function Burst() {
  return (
    <span className="burst" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--a': `${i * (360 / 16)}deg`,
              '--d': `${70 + (i % 3) * 22}px`,
              '--c': i % 2 ? 'var(--accent-2)' : 'var(--ok)',
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

/** Designer credit, shown on every screen. */
export function Credit() {
  useLang()
  return (
    <p className="credit">
      {t('credit')} <strong>Хан</strong>
    </p>
  )
}

/** English / Russian switch. */
export function LangSwitch() {
  const lang = useLang()
  return (
    <div className="lang" role="group" aria-label={t('aria.language')}>
      {(['en', 'ru'] as const).map((l) => (
        <button key={l} className={lang === l ? 'active' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l === 'en' ? 'EN' : 'RU'}
        </button>
      ))}
    </div>
  )
}
