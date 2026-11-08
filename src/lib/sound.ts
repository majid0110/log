// Short chime played when the button records something. Made with the Web Audio API, so there are no sound files.
// iPhones only allow sound that starts from a touch, so unlockSound() runs as the finger goes down.

type Ctx = AudioContext
let ctx: Ctx | null = null

export function unlockSound(): void {
  try {
    if (!ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!C) return
      ctx = new C()
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

const note = (c: Ctx, freq: number, start: number, length = 0.32, volume = 0.22): void => {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

/** Rising chime for entry, falling chime for exit. */
export function chime(kind: 'in' | 'out'): void {
  try {
    if (!ctx) return
    const notes = kind === 'in' ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25]
    const t0 = ctx.currentTime + 0.02
    notes.forEach((f, i) => note(ctx!, f, t0 + i * 0.11, i === notes.length - 1 ? 0.5 : 0.3))
  } catch {
    /* sound is optional */
  }
}

/** Soft tick when the hold starts. */
export function tick(): void {
  try {
    if (ctx) note(ctx, 880, ctx.currentTime + 0.005, 0.08, 0.08)
  } catch {
    /* optional */
  }
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported (iPhone) */
  }
}
