type GuardState = {
  count: number
  last: number
  lockUntil?: number
}

const PREFIX = 'auth_guard_v1:'
const MAX_ATTEMPTS = 5
const LOCK_MS = 60_000

function read(key: string): GuardState {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return { count: 0, last: 0 }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed == null) return { count: 0, last: 0 }
    return {
      count: Number(parsed.count) || 0,
      last: Number(parsed.last) || 0,
      lockUntil: parsed.lockUntil ? Number(parsed.lockUntil) : undefined,
    }
  } catch { return { count: 0, last: 0 } }
}

function write(key: string, s: GuardState) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(s)) } catch {}
}

export function getState(key: string): GuardState {
  const s = read(key)
  // Clear expired lock
  if (s.lockUntil && Date.now() >= s.lockUntil) {
    delete s.lockUntil
    write(key, s)
  }
  return s
}

export function reset(key: string) {
  write(key, { count: 0, last: Date.now(), lockUntil: undefined })
}

export function recordFailure(key: string): GuardState {
  const s = getState(key)
  const next: GuardState = { count: s.count + 1, last: Date.now(), lockUntil: s.lockUntil }
  if (next.count >= MAX_ATTEMPTS) {
    next.lockUntil = Date.now() + LOCK_MS
  }
  write(key, next)
  return next
}

export function backoffMsFor(key: string): number {
  const s = getState(key)
  // 500ms per failure, capped at 4000ms
  return Math.min(s.count * 500, 4000)
}

export function lockRemainingMs(key: string): number {
  const s = getState(key)
  if (!s.lockUntil) return 0
  return Math.max(0, s.lockUntil - Date.now())
}
