import { CheckSquare, Clock3, X } from 'lucide-react'
import { useMemo } from 'react'
import { aggregateLastSevenDays, summarizeDay } from '../lib/stats'
import { useApp } from '../state/AppContext'

export function StatsPage() {
  const { sessions, tasks, settings, m, taskTitle } = useApp()
  const taskMap = Object.fromEntries(tasks.map((task) => [task.id, taskTitle(task)]))
  const today = useMemo(() => summarizeDay(sessions), [sessions])
  const hours = Math.floor(today.minutes / 60)
  const minutes = today.minutes % 60
  const todaySessions = today.sessions
  const chartData = useMemo(() => aggregateLastSevenDays(sessions, new Date(), settings.locale).map((entry) => ({ label: entry.label, value: entry.minutes })), [sessions, settings.locale])
  const maxValue = Math.max(90, ...chartData.map((entry) => entry.value))

  return (
    <div className="stats-page page-content standard-page">
      <div className="page-heading-row"><h1>{m.stats.title}</h1><button className="range-button">{m.stats.range}</button></div>
      <div className="stats-summary">
        <div><span className="summary-icon"><Clock3 /></span><p>{m.stats.duration}<strong>{m.common.duration(hours, minutes)}</strong></p></div>
        <div><span className="summary-icon"><CheckSquare /></span><p>{m.stats.completed}<strong>{today.completed}</strong></p></div>
        <div><span className="summary-icon warm"><X /></span><p>{m.stats.abandoned}<strong>{today.abandoned}</strong></p></div>
      </div>
      <div className="stats-main">
        <section className="chart-section" aria-labelledby="chart-title">
          <h2 id="chart-title">{m.stats.daily}</h2>
          <div className="bar-chart" role="img" aria-label={chartData.map((entry) => `${entry.label} ${m.common.minuteAmount(entry.value)}`).join(', ')}>
            <div className="chart-grid"><span>{m.common.minuteAmount(90)}</span><span>{m.common.minuteAmount(60)}</span><span>{m.common.minuteAmount(30)}</span><span>{m.common.minuteAmount(0)}</span></div>
            <div className="bars">
              {chartData.map((entry) => <div className="bar-column" key={entry.label}><span className="bar-value">{entry.value > 0 ? `${entry.value}` : ''}</span><div className="bar" style={{ height: `${Math.max(entry.value ? 8 : 2, (entry.value / maxValue) * 100)}%` }} /><span>{entry.label}</span></div>)}
            </div>
          </div>
        </section>
        <aside className="stats-cat-art"><img src="/assets/art/cat-focus.png" alt={m.stats.chartCat} /></aside>
      </div>
      <section className="today-timeline">
        <h2>{m.stats.timeline}</h2>
        {todaySessions.length === 0 ? <div className="empty-state">{m.stats.empty}</div> : todaySessions.map((session) => (
          <article key={session.id} className={`timeline-row ${session.status}`}>
            <span className="timeline-dot">{session.status === 'completed' ? '✓' : '×'}</span>
            <strong>{session.taskId ? taskMap[session.taskId] ?? m.stats.unnamed : m.stats.free}</strong>
            <span>{m.common.minuteAmount(Math.floor(session.accumulatedMs / 60000))}</span>
          </article>
        ))}
      </section>
    </div>
  )
}
