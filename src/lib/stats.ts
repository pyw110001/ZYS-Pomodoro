import type { FocusSession } from '../types'
import type { Locale } from '../types'

export interface DayStat {
  date: Date
  label: string
  minutes: number
}

const completedMinutes = (sessions: FocusSession[]) => sessions
  .filter((session) => session.status === 'completed')
  .reduce((sum, session) => sum + Math.floor(session.accumulatedMs / 60000), 0)

export function sessionsForDay(sessions: FocusSession[], day: Date) {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return sessions.filter((session) => {
    const timestamp = session.endedAt ?? session.startedAt
    return timestamp >= start.getTime() && timestamp < end.getTime()
  })
}

export function summarizeDay(sessions: FocusSession[], day = new Date()) {
  const daily = sessionsForDay(sessions, day)
  return {
    sessions: daily,
    minutes: completedMinutes(daily),
    completed: daily.filter((session) => session.status === 'completed').length,
    abandoned: daily.filter((session) => session.status === 'abandoned').length
  }
}

export function aggregateLastSevenDays(sessions: FocusSession[], now = new Date(), locale: Locale = 'zh-CN'): DayStat[] {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const daily = sessionsForDay(sessions, date)
    return { date, label: weekday.format(date), minutes: completedMinutes(daily) }
  })
}
