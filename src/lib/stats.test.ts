import { describe, expect, it } from 'vitest'
import { aggregateLastSevenDays, summarizeDay } from './stats'
import type { FocusSession, SessionStatus } from '../types'

const makeSession = (id: string, date: string, status: SessionStatus, minutes: number): FocusSession => ({
  id,
  mode: 'pomodoro',
  plannedSeconds: minutes * 60,
  startedAt: new Date(date).getTime() - minutes * 60_000,
  lastResumedAt: new Date(date).getTime() - minutes * 60_000,
  endedAt: new Date(date).getTime(),
  accumulatedMs: minutes * 60_000,
  status,
  hiddenCount: 0
})

describe('statistics aggregation', () => {
  const sessions = [
    makeSession('one', '2026-08-17T09:30:00', 'completed', 25),
    makeSession('two', '2026-08-17T14:30:00', 'abandoned', 8),
    makeSession('three', '2026-08-16T18:30:00', 'completed', 45)
  ]

  it('summarizes only the requested local day', () => {
    const summary = summarizeDay(sessions, new Date('2026-08-17T12:00:00'))
    expect(summary.minutes).toBe(25)
    expect(summary.completed).toBe(1)
    expect(summary.abandoned).toBe(1)
  })

  it('creates a stable seven-day series ending today', () => {
    const series = aggregateLastSevenDays(sessions, new Date('2026-08-17T12:00:00'))
    expect(series).toHaveLength(7)
    expect(series.at(-1)?.minutes).toBe(25)
    expect(series.at(-2)?.minutes).toBe(45)
  })
})
