import { BarChart3, Clock3, Fish, Home, ListTodo, Settings, Star } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { zhCN } from '../i18n/zh-CN'
import { SettingsModal } from './SettingsModal'

const navItems = [
  { to: '/focus', label: zhCN.nav.focus, icon: Home },
  { to: '/tasks', label: zhCN.nav.tasks, icon: ListTodo },
  { to: '/collection', label: zhCN.nav.collection, icon: Star },
  { to: '/stats', label: zhCN.nav.stats, icon: BarChart3 }
]

export function AppShell() {
  const { loaded, storageError, meta, sessions, toast } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const today = new Date().toDateString()
  const todayMinutes = sessions
    .filter((session) => session.status === 'completed' && new Date(session.endedAt ?? session.startedAt).toDateString() === today)
    .reduce((sum, session) => sum + Math.floor((session.accumulatedMs || session.plannedSeconds * 1000) / 60000), 0)

  if (!loaded) return <div className="loading-screen"><span className="loading-cat">🐾</span><p>{zhCN.shell.loading}</p></div>
  if (storageError) return <div className="loading-screen storage-error"><span className="loading-cat">!</span><h1>{zhCN.shell.storageTitle}</h1><p>{storageError}</p><button className="secondary-button" onClick={() => window.location.reload()}>{zhCN.shell.retry}</button></div>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/app-icon.svg" alt="" /><span>{zhCN.brand}</span></div>
        <nav className="sidebar-nav" aria-label={zhCN.shell.mainNav}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-settings" onClick={() => setSettingsOpen(true)} aria-label={zhCN.common.settings}><Settings /></button>
      </aside>

      <main className="main-area">
        <header className="utility-bar">
          <div className="utility-chip"><Clock3 /><span>{zhCN.shell.todayMinutes(todayMinutes)}</span></div>
          <div className="utility-chip"><Fish className="fish-icon" /><span>{meta.fishBalance}</span></div>
          <button className="profile-button" onClick={() => setSettingsOpen(true)} aria-label={zhCN.common.settings}>
            <img src="/assets/art/cat-idle.png" alt="" />
          </button>
        </header>
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label={zhCN.shell.mobileNav}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
