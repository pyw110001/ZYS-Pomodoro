import { BarChart3, Clock3, Fish, Home, Languages, ListTodo, Settings, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { SettingsModal } from './SettingsModal'

export function AppShell() {
  const { loaded, storageError, meta, sessions, toast, settings, m, updateSettings } = useApp()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navItems = [
    { to: '/focus', label: m.nav.focus, icon: Home },
    { to: '/tasks', label: m.nav.tasks, icon: ListTodo },
    { to: '/collection', label: m.nav.collection, icon: Star },
    { to: '/stats', label: m.nav.stats, icon: BarChart3 }
  ]
  const today = new Date().toDateString()
  const todayMinutes = sessions
    .filter((session) => session.status === 'completed' && new Date(session.endedAt ?? session.startedAt).toDateString() === today)
    .reduce((sum, session) => sum + Math.floor((session.accumulatedMs || session.plannedSeconds * 1000) / 60000), 0)

  useEffect(() => {
    document.documentElement.dataset.viewTransitions = 'startViewTransition' in document ? 'true' : 'false'
  }, [])

  if (!loaded) return <div className="loading-screen"><span className="loading-cat">🐾</span><p>{m.shell.loading}</p></div>
  if (storageError) return <div className="loading-screen storage-error"><span className="loading-cat">!</span><h1>{m.shell.storageTitle}</h1><p>{storageError}</p><button className="secondary-button" onClick={() => window.location.reload()}>{m.shell.retry}</button></div>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/app-icon.svg" alt="" /><span>{m.brand}</span></div>
        <nav className="sidebar-nav" aria-label={m.shell.mainNav}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} viewTransition className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-settings" onClick={() => setSettingsOpen(true)} aria-label={m.common.settings}><Settings /></button>
      </aside>

      <main className="main-area">
        <header className="utility-bar">
          <div className="utility-chip"><Clock3 /><span>{m.shell.todayMinutes(todayMinutes)}</span></div>
          <div className="utility-chip"><Fish className="fish-icon" /><span>{meta.fishBalance}</span></div>
          <button className="language-button" onClick={() => updateSettings({ locale: settings.locale === 'zh-CN' ? 'en-US' : 'zh-CN' })} aria-label={m.settings.language}>
            <Languages /><span>{settings.locale === 'zh-CN' ? 'EN' : '中文'}</span>
          </button>
          <button className="profile-button" onClick={() => setSettingsOpen(true)} aria-label={m.common.settings}>
            <img src="/assets/art/cat-idle.png" alt="" />
          </button>
        </header>
        <div className="route-stage" key={location.pathname}><Outlet /></div>
      </main>

      <nav className="mobile-nav" aria-label={m.shell.mobileNav}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} viewTransition className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
