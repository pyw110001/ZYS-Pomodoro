import { CheckSquare, Paintbrush, Pause, Play, Square, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AmbientSound } from '../components/AmbientSound'
import { RewardModal } from '../components/RewardModal'
import { RoomScene, type CatState } from '../components/RoomScene'
import { formatClock, getElapsedSeconds, getRemainingSeconds } from '../lib/timer'
import { useApp } from '../state/AppContext'
import type { FocusMode } from '../types'
import { zhCN } from '../i18n/zh-CN'

const durationOptions = [15, 25, 45, 60]

export function FocusPage() {
  const { now, tasks, meta, settings, activeSession, completion, startSession, pauseSession, resumeSession, abandonSession, finishCountup, selectTask } = useApp()
  const [mode, setMode] = useState<FocusMode>('pomodoro')
  const [duration, setDuration] = useState(settings.pomodoroMinutes)
  const [error, setError] = useState('')
  const currentTask = tasks.find((task) => task.id === (activeSession?.taskId ?? meta.activeTaskId)) ?? tasks.find((task) => !task.completed)

  useEffect(() => { if (!activeSession) setDuration(settings.pomodoroMinutes) }, [activeSession, settings.pomodoroMinutes])

  const displaySeconds = useMemo(() => {
    if (!activeSession) return mode === 'pomodoro' ? duration * 60 : 0
    return activeSession.mode === 'pomodoro' ? getRemainingSeconds(activeSession, now) : getElapsedSeconds(activeSession, now)
  }, [activeSession, duration, mode, now])

  const catState: CatState = completion ? 'success' : activeSession?.status === 'running' ? 'focus' : 'idle'

  useEffect(() => {
    document.title = activeSession ? `${formatClock(displaySeconds)} · ${zhCN.brand}` : zhCN.brand
    return () => { document.title = zhCN.brand }
  }, [activeSession, displaySeconds])

  const handleStart = async () => {
    setError('')
    try { await startSession(mode, duration, currentTask?.id) }
    catch (reason) { setError(reason instanceof Error ? reason.message : zhCN.focus.startError) }
  }

  const handleAbandon = async () => {
    if (window.confirm(zhCN.focus.abandonConfirm)) await abandonSession()
  }

  return (
    <div className="focus-page page-content">
      <div className="mobile-brand-row"><div className="brand"><img src="/app-icon.svg" alt="" /><span>{zhCN.brand}</span></div></div>
      <section className="focus-room-column">
        <RoomScene catState={catState} />
        <div className="task-dock">
          <CheckSquare />
          <label htmlFor="active-task" className="sr-only">{zhCN.focus.currentTask}</label>
          <select id="active-task" value={currentTask?.id ?? ''} disabled={Boolean(activeSession)} onChange={(event) => selectTask(event.target.value || undefined)}>
            <option value="">{zhCN.focus.noTask}</option>
            {tasks.filter((task) => !task.completed).map((task) => <option value={task.id} key={task.id}>{task.title}</option>)}
          </select>
          <span className="task-status-dot" aria-hidden="true" />
          {[0, 1, 2].map((slot) => <Link className="task-slot-add" to="/tasks" aria-label={zhCN.tasks.addSlot} key={slot}>＋</Link>)}
        </div>
      </section>

      <section className="focus-controls" aria-label={zhCN.focus.controls}>
        <div className="current-task-heading"><CheckSquare /><strong>{currentTask?.title ?? zhCN.focus.chooseTask}</strong></div>
        <div className="mode-switch" role="group" aria-label={zhCN.focus.mode}>
          <button className={mode === 'pomodoro' ? 'selected' : ''} disabled={Boolean(activeSession)} onClick={() => setMode('pomodoro')}>{zhCN.focus.pomodoro}</button>
          <button className={mode === 'countup' ? 'selected' : ''} disabled={Boolean(activeSession)} onClick={() => setMode('countup')}>{zhCN.focus.countup}</button>
        </div>
        {!activeSession && mode === 'pomodoro' && (
          <div className="duration-pills" aria-label={zhCN.focus.duration}>
            {durationOptions.map((value) => <button key={value} className={duration === value ? 'selected' : ''} onClick={() => setDuration(value)}>{value}</button>)}
          </div>
        )}
        <div className="timer-display" aria-live="polite">{formatClock(displaySeconds)}</div>
        {error && <p className="form-error" role="alert">{error}</p>}

        {!activeSession ? (
          <button className="primary-button start-button" onClick={handleStart}><Play fill="currentColor" />{zhCN.focus.start}</button>
        ) : (
          <div className="active-actions">
            {activeSession.status === 'running'
              ? <button className="primary-button" onClick={pauseSession}><Pause fill="currentColor" />{zhCN.focus.pause}</button>
              : <button className="primary-button" onClick={resumeSession}><Play fill="currentColor" />{zhCN.focus.resume}</button>}
            {activeSession.mode === 'countup' && <button className="secondary-button" onClick={finishCountup}><Square />{zhCN.focus.finish}</button>}
            <button className="text-button danger-text" onClick={handleAbandon}><X />{zhCN.focus.abandon}</button>
          </div>
        )}

        <AmbientSound />
        <div className="focus-helper"><span className="gift-box" aria-hidden="true">✦</span><p>{zhCN.focus.helper}</p></div>
        <Link className="room-edit-button" to="/collection"><Paintbrush />{zhCN.focus.room}</Link>
      </section>
      <RewardModal />
    </div>
  )
}
