import { useEffect, useRef, useState } from 'react'
import { getSummary, type Summary } from './data'

/** Salary for one period, calculated by the database. `version` changes whenever data changes. */
export function useSummary(from: string, to: string, version: number): { summary: Summary | null; failed: boolean } {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    getSummary(from, to)
      .then((s) => {
        if (live) {
          setSummary(s)
          setFailed(false)
        }
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [from, to, version])

  return { summary, failed }
}

export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

/** Counts a number up smoothly whenever it changes. */
export function useCountUp(value: number, ms = 800): number {
  const [shown, setShown] = useState(reducedMotion() ? value : 0)
  const from = useRef(shown)

  useEffect(() => {
    if (reducedMotion()) {
      setShown(value)
      from.current = value
      return
    }
    const start = from.current
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = start + (value - start) * eased
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])

  return shown
}

/** Re-renders every `ms` while `active`, so a running clock stays current. */
export function useTick(active: boolean, ms = 30000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [active, ms])
  return now
}
