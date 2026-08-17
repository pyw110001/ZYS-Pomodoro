import { describe, expect, it } from 'vitest'
import { formatClock, getElapsedMs, getRemainingSeconds, isCountdownComplete } from './timer'
import type { FocusSession } from '../types'

const session = (patch: Partial<FocusSession> = {}): FocusSession => ({
  id: 'session-1',
  mode: 'pomodoro',
  plannedSeconds: 25 * 60,
  startedAt: 1_000,
  lastResumedAt: 1_000,
  accumulatedMs: 0,
  status: 'running',
  hiddenCount: 0,
  ...patch
})

describe('timestamp timer', () => {
  it('derives running time from timestamps instead of interval ticks', () => {
    expect(getElapsedMs(session(), 61_000)).toBe(60_000)
    expect(getRemainingSeconds(session(), 61_000)).toBe(24 * 60)
  })

  it('keeps paused time stable and resumes from accumulated time', () => {
    expect(getElapsedMs(session({ status: 'paused', accumulatedMs: 72_500 }), 999_999)).toBe(72_500)
    expect(getElapsedMs(session({ accumulatedMs: 72_500, lastResumedAt: 100_000 }), 130_000)).toBe(102_500)
  })

  it('survives a long background gap and identifies completion', () => {
    const focus = session({ lastResumedAt: 10_000 })
    expect(isCountdownComplete(focus, 1_510_000)).toBe(true)
    expect(getRemainingSeconds(focus, 1_700_000)).toBe(0)
  })

  it('guards against a system clock moving backwards', () => {
    expect(getElapsedMs(session({ lastResumedAt: 10_000 }), 5_000)).toBe(0)
  })

  it('formats clock text accessibly', () => {
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(-10)).toBe('00:00')
  })
})
