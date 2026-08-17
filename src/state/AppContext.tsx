import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { catalogById } from '../data/catalog'
import { db, defaultMeta, defaultSettings, exportDatabase, importDatabase, resetDatabase, seedDatabase } from '../data/db'
import { fishForMinutes, pickReward } from '../lib/rewards'
import { getElapsedMs, getElapsedSeconds, isCountdownComplete } from '../lib/timer'
import type { AppMeta, AppSettings, CompletionNotice, ExportPayload, FocusMode, FocusSession, FocusTask, InventoryEntry, RoomSlot } from '../types'
import { zhCN } from '../i18n/zh-CN'

interface AppContextValue {
  loaded: boolean
  storageError?: string
  now: number
  tasks: FocusTask[]
  sessions: FocusSession[]
  inventory: InventoryEntry[]
  meta: AppMeta
  settings: AppSettings
  activeSession?: FocusSession
  completion?: CompletionNotice
  toast?: string
  clearCompletion(): void
  startSession(mode: FocusMode, minutes: number, taskId?: string): Promise<void>
  pauseSession(): Promise<void>
  resumeSession(): Promise<void>
  abandonSession(): Promise<void>
  finishCountup(): Promise<void>
  createTask(title: string, dueDate?: string): Promise<void>
  updateTask(task: FocusTask): Promise<void>
  deleteTask(id: string): Promise<void>
  selectTask(id?: string): Promise<void>
  exchangeItem(itemId: string): Promise<void>
  equipItem(itemId: string): Promise<void>
  updateSettings(patch: Partial<AppSettings>): Promise<void>
  requestNotifications(): Promise<NotificationPermission | 'unsupported'>
  downloadExport(): Promise<void>
  restoreImport(file: File): Promise<void>
  resetAll(): Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('focus-cottage-sync') : null

export function AppProvider({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false)
  const [storageError, setStorageError] = useState<string>()
  const [now, setNow] = useState(Date.now())
  const [tasks, setTasks] = useState<FocusTask[]>([])
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [inventory, setInventory] = useState<InventoryEntry[]>([])
  const [meta, setMeta] = useState<AppMeta>(defaultMeta)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [completion, setCompletion] = useState<CompletionNotice>()
  const [toast, setToast] = useState<string>()
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const completingRef = useRef(false)

  const refresh = useCallback(async () => {
    const [nextTasks, nextSessions, nextInventory, nextMeta, nextSettings] = await Promise.all([
      db.tasks.orderBy('createdAt').reverse().toArray(),
      db.sessions.orderBy('startedAt').reverse().toArray(),
      db.inventory.toArray(),
      db.meta.get('app'),
      db.settings.get('settings')
    ])
    setTasks(nextTasks)
    setSessions(nextSessions)
    if (nextMeta) setMeta(nextMeta)
    if (nextSettings) setSettings(nextSettings)
    setInventory(nextInventory)
  }, [])

  const notifyPeers = useCallback(() => channel?.postMessage({ type: 'refresh' }), [])
  const flash = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(undefined), 3200)
  }, [])

  useEffect(() => {
    seedDatabase()
      .then(refresh)
      .catch(() => setStorageError(zhCN.system.storageUnavailable))
      .finally(() => setLoaded(true))
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    const handleChannel = () => refresh()
    channel?.addEventListener('message', handleChannel)
    return () => {
      window.clearInterval(timer)
      channel?.removeEventListener('message', handleChannel)
    }
  }, [refresh])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = settings.reducedMotion ? 'true' : 'false'
    return () => { delete document.documentElement.dataset.reduceMotion }
  }, [settings.reducedMotion])

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === meta.activeSessionId && (session.status === 'running' || session.status === 'paused')),
    [meta.activeSessionId, sessions]
  )

  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      flash(zhCN.system.wakeLock)
    }
  }, [flash])

  const releaseWakeLock = useCallback(async () => {
    try { await wakeLockRef.current?.release() } catch { /* already released */ }
    wakeLockRef.current = null
  }, [])

  const completeSession = useCallback(async (session: FocusSession) => {
    if (completingRef.current) return
    completingRef.current = true
    try {
      const elapsedMinutes = Math.max(1, Math.floor(getElapsedMs(session) / 60000))
      if (session.mode === 'countup' && elapsedMinutes < 10) {
        flash(zhCN.system.countupShort)
        return
      }

      let notice: CompletionNotice | undefined
      await db.transaction('rw', [db.sessions, db.inventory, db.meta, db.tasks], async () => {
        const current = await db.sessions.get(session.id)
        const currentMeta = await db.meta.get('app')
        if (!current || !currentMeta || current.status === 'completed' || current.status === 'abandoned') return

        const item = pickReward(elapsedMinutes)
        const owned = await db.inventory.get(item.id)
        const baseFish = fishForMinutes(elapsedMinutes)
        const fishDelta = baseFish + (owned ? 2 : 0)
        if (owned) await db.inventory.update(item.id, { quantity: owned.quantity + 1 })
        else await db.inventory.put({ itemId: item.id, quantity: 1, unlockedAt: Date.now() })

        await db.sessions.update(session.id, {
          status: 'completed',
          endedAt: Date.now(),
          accumulatedMs: getElapsedMs(current),
          rewardItemId: item.id,
          fishDelta
        })
        await db.meta.update('app', { fishBalance: currentMeta.fishBalance + fishDelta, activeSessionId: undefined })
        if (current.taskId) {
          const task = await db.tasks.get(current.taskId)
          if (task) await db.tasks.update(task.id, { focusMinutes: task.focusMinutes + elapsedMinutes })
        }
        notice = { sessionId: session.id, elapsedMinutes, item, fishDelta, duplicate: Boolean(owned) }
      })

      if (notice) {
        setCompletion(notice)
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          const notification = { body: zhCN.system.notificationBody(notice.item.name, notice.fishDelta) }
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready
              .then((registration) => registration.showNotification(zhCN.system.focusComplete, notification))
              .catch(() => new Notification(zhCN.system.focusComplete, notification))
          } else new Notification(zhCN.system.focusComplete, notification)
        }
      }
      await releaseWakeLock()
      await refresh()
      notifyPeers()
    } finally {
      completingRef.current = false
    }
  }, [flash, notifyPeers, refresh, releaseWakeLock])

  useEffect(() => {
    if (activeSession && isCountdownComplete(activeSession, now)) void completeSession(activeSession)
  }, [activeSession, completeSession, now])

  useEffect(() => {
    const handleVisibility = async () => {
      if (!activeSession) return
      if (document.hidden) {
        await db.sessions.update(activeSession.id, { hiddenCount: activeSession.hiddenCount + 1 })
        flash(zhCN.system.hidden)
      } else if (activeSession.status === 'running') {
        await acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [acquireWakeLock, activeSession, flash])

  const startSession = useCallback(async (mode: FocusMode, minutes: number, taskId?: string) => {
    await db.transaction('rw', [db.sessions, db.meta], async () => {
      const currentMeta = await db.meta.get('app')
      if (!currentMeta) throw new Error(zhCN.system.initializing)
      if (currentMeta.activeSessionId) {
        const current = await db.sessions.get(currentMeta.activeSessionId)
        if (current && (current.status === 'running' || current.status === 'paused')) throw new Error(zhCN.system.anotherTab)
      }
      const timestamp = Date.now()
      const session: FocusSession = {
        id: crypto.randomUUID(), mode, plannedSeconds: minutes * 60, startedAt: timestamp,
        lastResumedAt: timestamp, accumulatedMs: 0, status: 'running', taskId,
        hiddenCount: 0
      }
      await db.sessions.put(session)
      await db.meta.update('app', { activeSessionId: session.id, activeTaskId: taskId })
    })
    await acquireWakeLock()
    await refresh()
    notifyPeers()
  }, [acquireWakeLock, notifyPeers, refresh])

  const pauseSession = useCallback(async () => {
    if (!activeSession || activeSession.status !== 'running') return
    await db.sessions.update(activeSession.id, { status: 'paused', accumulatedMs: getElapsedMs(activeSession) })
    await releaseWakeLock()
    await refresh(); notifyPeers()
  }, [activeSession, notifyPeers, refresh, releaseWakeLock])

  const resumeSession = useCallback(async () => {
    if (!activeSession || activeSession.status !== 'paused') return
    await db.sessions.update(activeSession.id, { status: 'running', lastResumedAt: Date.now() })
    await acquireWakeLock()
    await refresh(); notifyPeers()
  }, [acquireWakeLock, activeSession, notifyPeers, refresh])

  const abandonSession = useCallback(async () => {
    if (!activeSession) return
    const elapsed = getElapsedSeconds(activeSession)
    await db.transaction('rw', [db.sessions, db.meta], async () => {
      if (elapsed < 15) await db.sessions.delete(activeSession.id)
      else await db.sessions.update(activeSession.id, { status: 'abandoned', endedAt: Date.now(), accumulatedMs: getElapsedMs(activeSession), rewardItemId: 'crumpled-note', fishDelta: 0 })
      await db.meta.update('app', { activeSessionId: undefined })
    })
    await releaseWakeLock()
    flash(elapsed < 15 ? zhCN.system.accidentalCancel : zhCN.system.abandoned)
    await refresh(); notifyPeers()
  }, [activeSession, flash, notifyPeers, refresh, releaseWakeLock])

  const finishCountup = useCallback(async () => {
    if (activeSession?.mode === 'countup') await completeSession(activeSession)
  }, [activeSession, completeSession])

  const createTask = useCallback(async (title: string, dueDate?: string) => {
    await db.tasks.put({ id: crypto.randomUUID(), title: title.trim(), dueDate: dueDate || undefined, completed: false, createdAt: Date.now(), focusMinutes: 0 })
    await refresh(); notifyPeers()
  }, [notifyPeers, refresh])

  const updateTask = useCallback(async (task: FocusTask) => { await db.tasks.put(task); await refresh(); notifyPeers() }, [notifyPeers, refresh])
  const deleteTask = useCallback(async (id: string) => { await db.tasks.delete(id); await refresh(); notifyPeers() }, [notifyPeers, refresh])
  const selectTask = useCallback(async (id?: string) => { await db.meta.update('app', { activeTaskId: id }); await refresh(); notifyPeers() }, [notifyPeers, refresh])

  const exchangeItem = useCallback(async (itemId: string) => {
    const item = catalogById[itemId]
    if (!item) return
    await db.transaction('rw', [db.inventory, db.meta], async () => {
      const [owned, currentMeta] = await Promise.all([db.inventory.get(itemId), db.meta.get('app')])
      if (owned || !currentMeta) return
      if (currentMeta.fishBalance < item.price) throw new Error(zhCN.system.notEnoughFish)
      await db.inventory.put({ itemId, quantity: 1, unlockedAt: Date.now() })
      await db.meta.update('app', { fishBalance: currentMeta.fishBalance - item.price })
    })
    await refresh(); notifyPeers()
  }, [notifyPeers, refresh])

  const equipItem = useCallback(async (itemId: string) => {
    const item = catalogById[itemId]
    const owned = inventory.some((entry) => entry.itemId === itemId)
    if (!item || !owned) return
    const roomLayout = { ...meta.roomLayout, [item.slot]: itemId } as Record<RoomSlot, string>
    await db.meta.update('app', { roomLayout })
    await refresh(); notifyPeers()
  }, [inventory, meta.roomLayout, notifyPeers, refresh])

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    await db.settings.update('settings', patch)
    await refresh(); notifyPeers()
  }, [notifyPeers, refresh])

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported' as const
    return Notification.requestPermission()
  }, [])

  const downloadExport = useCallback(async () => {
    const payload = await exportDatabase()
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `focus-cottage-${new Date().toISOString().slice(0, 10)}.json`; anchor.click()
    URL.revokeObjectURL(url)
  }, [])

  const restoreImport = useCallback(async (file: File) => {
    const payload = JSON.parse(await file.text()) as ExportPayload
    await importDatabase(payload)
    await refresh(); notifyPeers(); flash(zhCN.system.restored)
  }, [flash, notifyPeers, refresh])

  const resetAll = useCallback(async () => {
    await resetDatabase(); await refresh(); notifyPeers(); setCompletion(undefined); flash(zhCN.system.reset)
  }, [flash, notifyPeers, refresh])

  const value = useMemo<AppContextValue>(() => ({
    loaded, storageError, now, tasks, sessions, inventory, meta, settings, activeSession, completion, toast,
    clearCompletion: () => setCompletion(undefined), startSession, pauseSession, resumeSession, abandonSession,
    finishCountup, createTask, updateTask, deleteTask, selectTask, exchangeItem, equipItem, updateSettings,
    requestNotifications, downloadExport, restoreImport, resetAll
  }), [loaded, storageError, now, tasks, sessions, inventory, meta, settings, activeSession, completion, toast, startSession, pauseSession, resumeSession, abandonSession, finishCountup, createTask, updateTask, deleteTask, selectTask, exchangeItem, equipItem, updateSettings, requestNotifications, downloadExport, restoreImport, resetAll])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
