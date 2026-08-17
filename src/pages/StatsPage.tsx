import { CheckSquare, Clock3, X } from 'lucide-react'
import { useMemo } from 'react'
import { aggregateLastSevenDays, summarizeDay } from '../lib/stats'
import { useApp } from '../state/AppContext'
import { zhCN } from '../i18n/zh-CN'

export function StatsPage() {
  const { sessions, tasks } = useApp()
  const taskMap = Object.fromEntries(tasks.map((task) => [task.id, task.title]))
  const today = useMemo(() => summarizeDay(sessions), [sessions])
  const hours = Math.floor(today.minutes / 60)
  const minutes = today.minutes % 60
  const todaySessions = today.sessions
  const chartData = useMemo(() => aggregateLastSevenDays(sessions).map((entry) => ({ label: entry.label, value: entry.minutes })), [sessions])
  const maxValue = Math.max(90, ...chartData.map((entry) => entry.value))

  return (
    <div className="stats-page page-content standard-page">
      <div className="page-heading-row"><h1>{zhCN.stats.title}</h1><button className="range-button">{zhCN.stats.range}</button></div>
      <div className="stats-summary">
        <div><span className="summary-icon"><Clock3 /></span><p>{zhCN.stats.duration}<strong>{zhCN.common.duration(hours, minutes)}</strong></p></div>
        <div><span className="summary-icon"><CheckSquare /></span><p>{zhCN.stats.completed}<strong>{today.completed}</strong></p></div>
        <div><span className="summary-icon warm"><X /></span><p>{zhCN.stats.abandoned}<strong>{today.abandoned}</strong></p></div>
      </div>
      <div className="stats-main">
        <section className="chart-section" aria-labelledby="chart-title">
          <h2 id="chart-title">{zhCN.stats.daily}</h2>
          <div className="bar-chart" role="img" aria-label={chartData.map((entry) => `${entry.label}${zhCN.common.minuteAmount(entry.value)}`).join('，')}>
            <div className="chart-grid"><span>{zhCN.common.minuteAmount(90)}</span><span>{zhCN.common.minuteAmount(60)}</span><span>{zhCN.common.minuteAmount(30)}</span><span>{zhCN.common.minuteAmount(0)}</span></div>
            <div className="bars">
              {chartData.map((entry) => <div className="bar-column" key={entry.label}><span className="bar-value">{entry.value > 0 ? `${entry.value}` : ''}</span><div className="bar" style={{ height: `${Math.max(entry.value ? 8 : 2, (entry.value / maxValue) * 100)}%` }} /><span>{entry.label}</span></div>)}
            </div>
          </div>
        </section>
        <aside className="stats-cat-art"><img src="/assets/art/cat-focus.png" alt={zhCN.stats.chartCat} /></aside>
      </div>
      <section className="today-timeline">
        <h2>{zhCN.stats.timeline}</h2>
        {todaySessions.length === 0 ? <div className="empty-state">{zhCN.stats.empty}</div> : todaySessions.map((session) => (
          <article key={session.id} className={`timeline-row ${session.status}`}>
            <span className="timeline-dot">{session.status === 'completed' ? '✓' : '×'}</span>
            <strong>{session.taskId ? taskMap[session.taskId] ?? zhCN.stats.unnamed : zhCN.stats.free}</strong>
            <span>{zhCN.common.minuteAmount(Math.floor(session.accumulatedMs / 60000))}</span>
          </article>
        ))}
      </section>
    </div>
  )
}
