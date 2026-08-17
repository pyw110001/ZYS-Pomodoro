import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { catalogById } from '../data/catalog'
import { db, defaultMeta, defaultSettings, exportDatabase, importDatabase, resetDatabase, seedDatabase } from '../data/db'
import { getCatalogName, getMessages, getTaskTitle } from '../i18n'
import type { Messages } from '../i18n/zh-CN'
import { validateAudioFile } from '../lib/customAudio'
import { fishForMinutes, pickReward } from '../lib/rewards'
import { getElapsedMs, getElapsedSeconds, isCountdownComplete } from '../lib/timer'
import type { AppMeta, AppSettings, CompletionNotice, CustomSound, ExportPayload, FocusMode, FocusSession, FocusTask, InventoryEntry, LegacyExportPayload, RoomSlot, SoundChoice } from '../types'

export type AmbientPlaybackStatus = 'idle' | 'playing' | 'paused' | 'blocked' | 'error'

interface AppContextValue {
  loaded: boolean
  storageError?: string
  now: number
  tasks: FocusTask[]
  sessions: FocusSession[]
  inventory: InventoryEntry[]
  meta: AppMeta
  settings: AppSettings
  m: Messages
  customSounds: CustomSound[]
  ambientStatus: AmbientPlaybackStatus
  ambientError?: 'blocked' | 'unsupported'
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
  taskTitle(task: FocusTask): string
  catalogName(itemId: string): string
  selectSound(sound: SoundChoice, customSoundId?: string): Promise<void>
  pauseAmbient(): void
  resumeAmbient(): void
  addCustomSound(file: File): Promise<void>
  renameCustomSound(id: string, name: string): Promise<void>
  deleteCustomSound(id: string): Promise<void>
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
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([])
  const [ambientStatus, setAmbientStatus] = useState<AmbientPlaybackStatus>('idle')
  const [ambientError, setAmbientError] = useState<'blocked' | 'unsupported'>()
  const [audioArmed, setAudioArmed] = useState(false)
  const [completion, setCompletion] = useState<CompletionNotice>()
  const [toast, setToast] = useState<string>()
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const completingRef = useRef(false)
  const audioCleanupRef = useRef<(() => void) | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioGainRef = useRef<GainNode | null>(null)
  const m = useMemo(() => getMessages(settings.locale), [settings.locale])

  const refresh = useCallback(async () => {
    const [nextTasks, nextSessions, nextInventory, nextMeta, nextSettings, nextCustomSounds] = await Promise.all([
      db.tasks.orderBy('createdAt').reverse().toArray(),
      db.sessions.orderBy('startedAt').reverse().toArray(),
      db.inventory.toArray(),
      db.meta.get('app'),
      db.settings.get('settings'),
      db.customSounds.orderBy('createdAt').reverse().toArray()
    ])
    setTasks(nextTasks)
    setSessions(nextSessions)
    if (nextMeta) setMeta(nextMeta)
    if (nextSettings) setSettings(nextSettings)
    setInventory(nextInventory)
    setCustomSounds(nextCustomSounds)
  }, [])

  const notifyPeers = useCallback(() => channel?.postMessage({ type: 'refresh' }), [])
  const flash = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(undefined), 3200)
  }, [])

  useEffect(() => {
    seedDatabase()
      .then(refresh)
      .catch(() => setStorageError(getMessages(defaultSettings.locale).system.storageUnavailable))
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
    document.documentElement.lang = settings.locale
    document.title = m.brand
    return () => { delete document.documentElement.dataset.reduceMotion }
  }, [m.brand, settings.locale, settings.reducedMotion])

  useEffect(() => {
    if (audioElementRef.current) audioElementRef.current.volume = settings.volume
    if (audioGainRef.current) audioGainRef.current.gain.value = settings.volume * 0.16
  }, [settings.volume])

  useEffect(() => {
    audioCleanupRef.current?.()
    audioCleanupRef.current = null
    audioElementRef.current = null
    audioGainRef.current = null
    setAmbientError(undefined)

    if (!audioArmed || settings.sound === 'off') {
      setAmbientStatus(settings.sound === 'off' ? 'idle' : 'paused')
      return
    }

    let cancelled = false
    const start = async () => {
      if (settings.sound === 'custom') {
        const custom = settings.customSoundId ? await db.customSounds.get(settings.customSoundId) : undefined
        if (!custom) {
          setAmbientStatus('error')
          setAmbientError('unsupported')
          return
        }
        const url = URL.createObjectURL(custom.blob)
        const audio = new Audio(url)
        audio.loop = true
        audio.volume = settings.volume
        audioElementRef.current = audio
        audioCleanupRef.current = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url) }
        try {
          await audio.play()
          if (!cancelled) setAmbientStatus('playing')
        } catch (reason) {
          if (cancelled) return
          const name = reason instanceof DOMException ? reason.name : ''
          setAmbientError(name === 'NotAllowedError' ? 'blocked' : 'unsupported')
          setAmbientStatus(name === 'NotAllowedError' ? 'blocked' : 'error')
        }
        return
      }

      const AudioContextType = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextType) {
        setAmbientError('unsupported')
        setAmbientStatus('error')
        return
      }
      const context = new AudioContextType()
      const master = context.createGain()
      master.gain.value = settings.volume * 0.16
      master.connect(context.destination)
      audioGainRef.current = master
      if (settings.sound === 'rain') {
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
        const data = buffer.getChannelData(0)
        for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
        const source = context.createBufferSource()
        const filter = context.createBiquadFilter()
        source.buffer = buffer; source.loop = true; filter.type = 'lowpass'; filter.frequency.value = 1400
        source.connect(filter).connect(master); source.start()
      } else {
        const oscillator = context.createOscillator()
        const lfo = context.createOscillator()
        const lfoGain = context.createGain()
        oscillator.type = 'sine'; oscillator.frequency.value = 68
        lfo.frequency.value = 4.2; lfoGain.gain.value = 0.35
        lfo.connect(lfoGain).connect(master.gain); oscillator.connect(master); oscillator.start(); lfo.start()
      }
      audioCleanupRef.current = () => void context.close()
      try {
        if (context.state === 'suspended') await context.resume()
        if (!cancelled) setAmbientStatus('playing')
      } catch {
        if (!cancelled) { setAmbientError('blocked'); setAmbientStatus('blocked') }
      }
    }
    void start()
    return () => { cancelled = true; audioCleanupRef.current?.(); audioCleanupRef.current = null }
  }, [audioArmed, settings.customSoundId, settings.sound])

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
      flash(m.system.wakeLock)
    }
  }, [flash, m.system.wakeLock])

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
        flash(m.system.countupShort)
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
          const itemName = getCatalogName(notice.item.id, settings.locale)
          const notification = { body: m.system.notificationBody(itemName, notice.fishDelta) }
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready
              .then((registration) => registration.showNotification(m.system.focusComplete, notification))
              .catch(() => new Notification(m.system.focusComplete, notification))
          } else new Notification(m.system.focusComplete, notification)
        }
      }
      await releaseWakeLock()
      await refresh()
      notifyPeers()
    } finally {
      completingRef.current = false
    }
  }, [flash, m, notifyPeers, refresh, releaseWakeLock, settings.locale])

  useEffect(() => {
    if (activeSession && isCountdownComplete(activeSession, now)) void completeSession(activeSession)
  }, [activeSession, completeSession, now])

  useEffect(() => {
    const handleVisibility = async () => {
      if (!activeSession) return
      if (document.hidden) {
        await db.sessions.update(activeSession.id, { hiddenCount: activeSession.hiddenCount + 1 })
        flash(m.system.hidden)
      } else if (activeSession.status === 'running') {
        await acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [acquireWakeLock, activeSession, flash, m.system.hidden])

  const startSession = useCallback(async (mode: FocusMode, minutes: number, taskId?: string) => {
    await db.transaction('rw', [db.sessions, db.meta], async () => {
      const currentMeta = await db.meta.get('app')
      if (!currentMeta) throw new Error(m.system.initializing)
      if (currentMeta.activeSessionId) {
        const current = await db.sessions.get(currentMeta.activeSessionId)
        if (current && (current.status === 'running' || current.status === 'paused')) throw new Error(m.system.anotherTab)
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
  }, [acquireWakeLock, m.system.anotherTab, m.system.initializing, notifyPeers, refresh])

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
    flash(elapsed < 15 ? m.system.accidentalCancel : m.system.abandoned)
    await refresh(); notifyPeers()
  }, [activeSession, flash, m.system.abandoned, m.system.accidentalCancel, notifyPeers, refresh, releaseWakeLock])

  const finishCountup = useCallback(async () => {
    if (activeSession?.mode === 'countup') await completeSession(activeSession)
  }, [activeSession, completeSession])

  const createTask = useCallback(async (title: string, dueDate?: string) => {
    await db.tasks.put({ id: crypto.randomUUID(), title: title.trim(), dueDate: dueDate || undefined, completed: false, createdAt: Date.now(), focusMinutes: 0 })
    await refresh(); notifyPeers()
  }, [notifyPeers, refresh])

  const updateTask = useCallback(async (task: FocusTask) => {
    const current = await db.tasks.get(task.id)
    await db.tasks.put({ ...task, titleKey: current?.title === task.title ? current.titleKey : undefined })
    await refresh(); notifyPeers()
  }, [notifyPeers, refresh])
  const deleteTask = useCallback(async (id: string) => { await db.tasks.delete(id); await refresh(); notifyPeers() }, [notifyPeers, refresh])
  const selectTask = useCallback(async (id?: string) => { await db.meta.update('app', { activeTaskId: id }); await refresh(); notifyPeers() }, [notifyPeers, refresh])

  const exchangeItem = useCallback(async (itemId: string) => {
    const item = catalogById[itemId]
    if (!item) return
    await db.transaction('rw', [db.inventory, db.meta], async () => {
      const [owned, currentMeta] = await Promise.all([db.inventory.get(itemId), db.meta.get('app')])
      if (owned || !currentMeta) return
      if (currentMeta.fishBalance < item.price) throw new Error(m.system.notEnoughFish)
      await db.inventory.put({ itemId, quantity: 1, unlockedAt: Date.now() })
      await db.meta.update('app', { fishBalance: currentMeta.fishBalance - item.price })
    })
    await refresh(); notifyPeers()
  }, [m.system.notEnoughFish, notifyPeers, refresh])

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

  const taskTitle = useCallback((task: FocusTask) => getTaskTitle(task, settings.locale), [settings.locale])
  const catalogName = useCallback((itemId: string) => getCatalogName(itemId, settings.locale), [settings.locale])

  const selectSound = useCallback(async (sound: SoundChoice, customSoundId?: string) => {
    await updateSettings({ sound, customSoundId: sound === 'custom' ? customSoundId : undefined })
    setAudioArmed(sound !== 'off')
  }, [updateSettings])

  const pauseAmbient = useCallback(() => setAudioArmed(false), [])
  const resumeAmbient = useCallback(() => {
    if (settings.sound !== 'off') setAudioArmed(true)
  }, [settings.sound])

  const addCustomSound = useCallback(async (file: File) => {
    const error = validateAudioFile(file, customSounds)
    if (error) {
      const message = error === 'type' ? m.system.audioType : error === 'file-size' ? m.system.audioTooLarge : error === 'count' ? m.system.audioCount : m.system.audioTotal
      throw new Error(message)
    }
    const sound: CustomSound = { id: crypto.randomUUID(), name: file.name, mimeType: file.type || 'audio/*', size: file.size, blob: file, createdAt: Date.now() }
    try { await db.customSounds.put(sound) }
    catch (reason) {
      if (reason instanceof DOMException && reason.name === 'QuotaExceededError') throw new Error(m.system.audioQuota)
      throw reason
    }
    await refresh(); notifyPeers(); flash(m.system.audioSaved)
    await selectSound('custom', sound.id)
  }, [customSounds, flash, m.system, notifyPeers, refresh, selectSound])

  const renameCustomSound = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.customSounds.update(id, { name: trimmed })
    await refresh(); notifyPeers()
  }, [notifyPeers, refresh])

  const deleteCustomSound = useCallback(async (id: string) => {
    await db.customSounds.delete(id)
    if (settings.customSoundId === id) {
      setAudioArmed(false)
      await db.settings.update('settings', { sound: 'off', customSoundId: undefined })
    }
    await refresh(); notifyPeers(); flash(m.system.audioDeleted)
  }, [flash, m.system.audioDeleted, notifyPeers, refresh, settings.customSoundId])

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
    const payload = JSON.parse(await file.text()) as ExportPayload | LegacyExportPayload
    try { await importDatabase(payload) }
    catch (reason) {
      if (reason instanceof Error && reason.message === 'UNSUPPORTED_DATA') throw new Error(m.system.unsupportedData)
      throw reason
    }
    setAudioArmed(false)
    await refresh(); notifyPeers(); flash(m.system.restored)
  }, [flash, m.system.restored, m.system.unsupportedData, notifyPeers, refresh])

  const resetAll = useCallback(async () => {
    setAudioArmed(false)
    await resetDatabase(); await refresh(); notifyPeers(); setCompletion(undefined); flash(m.system.reset)
  }, [flash, m.system.reset, notifyPeers, refresh])

  const value = useMemo<AppContextValue>(() => ({
    loaded, storageError, now, tasks, sessions, inventory, meta, settings, m, customSounds, ambientStatus, ambientError, activeSession, completion, toast,
    clearCompletion: () => setCompletion(undefined), startSession, pauseSession, resumeSession, abandonSession,
    finishCountup, createTask, updateTask, deleteTask, selectTask, exchangeItem, equipItem, updateSettings,
    taskTitle, catalogName, selectSound, pauseAmbient, resumeAmbient, addCustomSound, renameCustomSound, deleteCustomSound,
    requestNotifications, downloadExport, restoreImport, resetAll
  }), [loaded, storageError, now, tasks, sessions, inventory, meta, settings, m, customSounds, ambientStatus, ambientError, activeSession, completion, toast, startSession, pauseSession, resumeSession, abandonSession, finishCountup, createTask, updateTask, deleteTask, selectTask, exchangeItem, equipItem, updateSettings, taskTitle, catalogName, selectSound, pauseAmbient, resumeAmbient, addCustomSound, renameCustomSound, deleteCustomSound, requestNotifications, downloadExport, restoreImport, resetAll])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
