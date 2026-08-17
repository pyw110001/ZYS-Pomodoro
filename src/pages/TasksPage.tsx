import { CalendarDays, Check, Pencil, Play, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { FocusTask } from '../types'
import { zhCN } from '../i18n/zh-CN'

export function TasksPage() {
  const { tasks, createTask, updateTask, deleteTask, selectTask } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'open' | 'done'>('open')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<FocusTask>()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'done' ? task.completed : !task.completed), [filter, tasks])
  const completedToday = tasks.filter((task) => task.completed).length

  const openForm = (task?: FocusTask) => {
    setEditing(task); setTitle(task?.title ?? ''); setDueDate(task?.dueDate ?? ''); setCreating(true)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    if (editing) await updateTask({ ...editing, title: title.trim(), dueDate: dueDate || undefined })
    else await createTask(title, dueDate)
    setCreating(false); setEditing(undefined); setTitle(''); setDueDate('')
  }
  const dueLabel = (task: FocusTask) => {
    if (!task.dueDate) return zhCN.tasks.noDue
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    return task.dueDate === today ? zhCN.common.today : task.dueDate === tomorrow ? zhCN.common.tomorrow : task.dueDate
  }

  return (
    <div className="tasks-page page-content standard-page">
      <div className="page-heading-row"><h1>{zhCN.tasks.title}</h1><button className="primary-button compact-button" onClick={() => openForm()}><Plus />{zhCN.tasks.new}</button></div>
      <div className="tasks-layout">
        <section className="task-list-section">
          <div className="filter-switch">
            <button className={filter === 'open' ? 'selected' : ''} onClick={() => setFilter('open')}>{zhCN.tasks.open}</button>
            <button className={filter === 'done' ? 'selected' : ''} onClick={() => setFilter('done')}>{zhCN.tasks.done}</button>
          </div>
          {creating && (
            <form className="task-form" onSubmit={submit}>
              <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={zhCN.tasks.placeholder} aria-label={zhCN.tasks.titleLabel} />
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label={zhCN.tasks.dueLabel} />
              <button className="icon-button confirm" type="submit" aria-label={zhCN.common.save}><Check /></button>
              <button className="icon-button" type="button" onClick={() => setCreating(false)} aria-label={zhCN.common.cancel}><X /></button>
            </form>
          )}
          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className="task-row" key={task.id}>
                <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => updateTask({ ...task, completed: !task.completed })} aria-label={task.completed ? zhCN.tasks.markOpen : zhCN.tasks.markDone}>{task.completed && <Check />}</button>
                <div className="task-title"><strong>{task.title}</strong>{task.focusMinutes > 0 && <span>{zhCN.tasks.focused(task.focusMinutes)}</span>}</div>
                <div className="task-date"><CalendarDays />{dueLabel(task)}</div>
                {!task.completed && <button className="task-focus-button" onClick={async () => { await selectTask(task.id); navigate('/focus') }}><Play fill="currentColor" />{zhCN.focus.start}</button>}
                <button className="row-icon-button" onClick={() => openForm(task)} aria-label={zhCN.tasks.edit}><Pencil /></button>
                <button className="row-icon-button delete" onClick={() => window.confirm(zhCN.tasks.removeConfirm) && deleteTask(task.id)} aria-label={zhCN.tasks.remove}><Trash2 /></button>
              </article>
            ))}
            {visibleTasks.length === 0 && <div className="empty-state">{zhCN.tasks.empty}</div>}
          </div>
        </section>
        <aside className="reading-nook" aria-hidden="true">
          <img src="/assets/art/room-background.png" alt="" />
        </aside>
      </div>
      <div className="task-progress"><span>{zhCN.tasks.progress}</span><strong>{completedToday} / {tasks.length}</strong></div>
    </div>
  )
}
