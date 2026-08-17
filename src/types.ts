export type FocusMode = 'pomodoro' | 'countup'
export type SessionStatus = 'running' | 'paused' | 'completed' | 'abandoned'
export type Rarity = 'common' | 'rare' | 'special'
export type RoomSlot = 'rug' | 'cushion' | 'leftDecor' | 'rightDecor'
export type Locale = 'zh-CN' | 'en-US'
export type SoundChoice = 'off' | 'rain' | 'purr' | 'custom'
export type StarterTaskKey = 'research' | 'assets' | 'reading'

export interface FocusSession {
  id: string
  mode: FocusMode
  plannedSeconds: number
  startedAt: number
  lastResumedAt: number
  accumulatedMs: number
  status: SessionStatus
  taskId?: string
  endedAt?: number
  hiddenCount: number
  rewardItemId?: string
  fishDelta?: number
}

export interface FocusTask {
  id: string
  title: string
  completed: boolean
  createdAt: number
  dueDate?: string
  focusMinutes: number
  titleKey?: StarterTaskKey
}

export interface CatalogItem {
  id: string
  rarity: Rarity
  price: number
  slot: RoomSlot
  image: string
}

export interface InventoryEntry {
  itemId: string
  quantity: number
  unlockedAt: number
}

export interface RoomLayout {
  rug?: string
  cushion?: string
  leftDecor?: string
  rightDecor?: string
}

export interface AppSettings {
  id: 'settings'
  locale: Locale
  pomodoroMinutes: number
  breakMinutes: number
  sound: SoundChoice
  customSoundId?: string
  volume: number
  reducedMotion: boolean
}

export interface AppMeta {
  id: 'app'
  fishBalance: number
  activeSessionId?: string
  activeTaskId?: string
  roomLayout: RoomLayout
  schemaVersion: 1 | 2
}

export interface CustomSound {
  id: string
  name: string
  mimeType: string
  size: number
  blob: Blob
  createdAt: number
}

export interface CompletionNotice {
  sessionId: string
  elapsedMinutes: number
  item: CatalogItem
  fishDelta: number
  duplicate: boolean
}

export interface ExportPayload {
  version: 2
  exportedAt: number
  sessions: FocusSession[]
  tasks: FocusTask[]
  inventory: InventoryEntry[]
  settings: AppSettings
  meta: AppMeta
}

export interface LegacyExportPayload extends Omit<ExportPayload, 'version' | 'settings'> {
  version: 1
  settings: Omit<AppSettings, 'locale' | 'sound' | 'customSoundId'> & {
    locale: 'zh-CN'
    sound: 'off' | 'rain' | 'purr'
  }
}
