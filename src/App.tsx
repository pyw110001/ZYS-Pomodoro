import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CollectionPage } from './pages/CollectionPage'
import { FocusPage } from './pages/FocusPage'
import { StatsPage } from './pages/StatsPage'
import { TasksPage } from './pages/TasksPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/focus" replace />} />
    </Routes>
  )
}
