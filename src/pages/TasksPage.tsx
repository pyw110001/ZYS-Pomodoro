import { CalendarDays, Check, Pencil, Play, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { FocusTask } from '../types'

export function TasksPage() {
  const { tasks, settings, m, taskTitle, createTask, updateTask, deleteTask, selectTask } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'open' | 'done'>('open')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<FocusTask>()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'done' ? task.completed : !task.completed), [filter, tasks])
  const completedToday = tasks.filter((task) => task.completed).length

  const openForm = (task?: FocusTask) => {
    setEditing(task); setTitle(task ? taskTitle(task) : ''); setDueDate(task?.dueDate ?? ''); setCreating(true)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    if (editing) await updateTask({ ...editing, title: title.trim(), dueDate: dueDate || undefined })
    else await createTask(title, dueDate)
    setCreating(false); setEditing(undefined); setTitle(''); setDueDate('')
  }
  const dueLabel = (task: FocusTask) => {
    if (!task.dueDate) return m.tasks.noDue
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    return task.dueDate === today ? m.common.today : task.dueDate === tomorrow ? m.common.tomorrow
      : new Intl.DateTimeFormat(settings.locale, { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T00:00:00`))
  }

  return (
    <div className="tasks-page page-content standard-page">
      <div className="page-heading-row"><h1>{m.tasks.title}</h1><button className="primary-button compact-button" onClick={() => openForm()}><Plus />{m.tasks.new}</button></div>
      <div className="tasks-layout">
        <section className="task-list-section">
          <div className="filter-switch">
            <button className={filter === 'open' ? 'selected' : ''} onClick={() => setFilter('open')}>{m.tasks.open}</button>
            <button className={filter === 'done' ? 'selected' : ''} onClick={() => setFilter('done')}>{m.tasks.done}</button>
          </div>
          {creating && (
            <form className="task-form" onSubmit={submit}>
              <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={m.tasks.placeholder} aria-label={m.tasks.titleLabel} />
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label={m.tasks.dueLabel} />
              <button className="icon-button confirm" type="submit" aria-label={m.common.save}><Check /></button>
              <button className="icon-button" type="button" onClick={() => setCreating(false)} aria-label={m.common.cancel}><X /></button>
            </form>
          )}
          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className="task-row" key={task.id}>
                <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => updateTask({ ...task, completed: !task.completed })} aria-label={task.completed ? m.tasks.markOpen : m.tasks.markDone}>{task.completed && <Check />}</button>
                <div className="task-title"><strong>{taskTitle(task)}</strong>{task.focusMinutes > 0 && <span>{m.tasks.focused(task.focusMinutes)}</span>}</div>
                <div className="task-date"><CalendarDays />{dueLabel(task)}</div>
                {!task.completed && <button className="task-focus-button" onClick={async () => { await selectTask(task.id); navigate('/focus', { viewTransition: true }) }}><Play fill="currentColor" />{m.focus.start}</button>}
                <button className="row-icon-button" onClick={() => openForm(task)} aria-label={m.tasks.edit}><Pencil /></button>
                <button className="row-icon-button delete" onClick={() => window.confirm(m.tasks.removeConfirm) && deleteTask(task.id)} aria-label={m.tasks.remove}><Trash2 /></button>
              </article>
            ))}
            {visibleTasks.length === 0 && <div className="empty-state">{m.tasks.empty}</div>}
          </div>
        </section>
        <aside className="reading-nook" aria-hidden="true">
          <img src="/assets/art/room-background.png" alt="" />
        </aside>
      </div>
      <div className="task-progress"><span>{m.tasks.progress}</span><strong>{completedToday} / {tasks.length}</strong></div>
    </div>
  )
}
