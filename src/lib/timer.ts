import type { FocusSession } from '../types'

export const getElapsedMs = (session: FocusSession, now = Date.now()) => {
  const live = session.status === 'running' ? Math.max(0, now - session.lastResumedAt) : 0
  return Math.max(0, session.accumulatedMs + live)
}

export const getElapsedSeconds = (session: FocusSession, now = Date.now()) =>
  Math.floor(getElapsedMs(session, now) / 1000)

export const getRemainingSeconds = (session: FocusSession, now = Date.now()) =>
  Math.max(0, session.plannedSeconds - getElapsedSeconds(session, now))

export const isCountdownComplete = (session: FocusSession, now = Date.now()) =>
  session.mode === 'pomodoro' && getRemainingSeconds(session, now) <= 0

export const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const remainder = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
