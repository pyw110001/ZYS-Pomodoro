import Dexie, { type EntityTable } from 'dexie'
import { zhCN } from '../i18n/zh-CN'
import type { AppMeta, AppSettings, CustomSound, ExportPayload, FocusSession, FocusTask, InventoryEntry, LegacyExportPayload, StarterTaskKey } from '../types'

const starterTaskIds: Record<string, StarterTaskKey> = {
  'task-research': 'research',
  'task-assets': 'assets',
  'task-reading': 'reading'
}

export class FocusDatabase extends Dexie {
  sessions!: EntityTable<FocusSession, 'id'>
  tasks!: EntityTable<FocusTask, 'id'>
  inventory!: EntityTable<InventoryEntry, 'itemId'>
  settings!: EntityTable<AppSettings, 'id'>
  meta!: EntityTable<AppMeta, 'id'>
  customSounds!: EntityTable<CustomSound, 'id'>

  constructor(name = 'focus-cottage-db') {
    super(name)
    this.version(1).stores({
      sessions: 'id, status, startedAt, endedAt, taskId',
      tasks: 'id, completed, createdAt, dueDate',
      inventory: 'itemId, unlockedAt',
      settings: 'id',
      meta: 'id'
    })
    this.version(2).stores({
      sessions: 'id, status, startedAt, endedAt, taskId',
      tasks: 'id, completed, createdAt, dueDate',
      inventory: 'itemId, unlockedAt',
      settings: 'id',
      meta: 'id',
      customSounds: 'id, createdAt'
    }).upgrade(async (transaction) => {
      const taskTable = transaction.table<FocusTask, string>('tasks')
      const tasks = await taskTable.toArray()
      for (const task of tasks) {
        const titleKey = starterTaskIds[task.id]
        if (titleKey && task.title === zhCN.starterTasks[titleKey]) await taskTable.update(task.id, { titleKey })
      }
      await transaction.table<AppMeta, string>('meta').update('app', { schemaVersion: 2 })
    })
  }
}

export const db = new FocusDatabase()

export const defaultSettings: AppSettings = {
  id: 'settings',
  locale: 'zh-CN',
  pomodoroMinutes: 25,
  breakMinutes: 5,
  sound: 'off',
  volume: 0.45,
  reducedMotion: false
}

export const defaultMeta: AppMeta = {
  id: 'app',
  fishBalance: 128,
  roomLayout: { rug: 'rug', cushion: 'cushion', leftDecor: 'plant', rightDecor: 'vase' },
  schemaVersion: 2,
  activeTaskId: 'task-research'
}

const starterTasks: FocusTask[] = [
  { id: 'task-research', title: zhCN.starterTasks.research, titleKey: 'research', completed: false, createdAt: Date.now() - 3000, dueDate: new Date().toISOString().slice(0, 10), focusMinutes: 0 },
  { id: 'task-assets', title: zhCN.starterTasks.assets, titleKey: 'assets', completed: false, createdAt: Date.now() - 2000, dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), focusMinutes: 0 },
  { id: 'task-reading', title: zhCN.starterTasks.reading, titleKey: 'reading', completed: false, createdAt: Date.now() - 1000, focusMinutes: 0 }
]

export async function seedDatabase() {
  const meta = await db.meta.get('app')
  if (meta) return
  await db.transaction('rw', [db.meta, db.settings, db.tasks, db.inventory], async () => {
    await db.meta.put(defaultMeta)
    await db.settings.put(defaultSettings)
    await db.tasks.bulkPut(starterTasks)
    await db.inventory.bulkPut(['plant', 'vase', 'cushion', 'rug'].map((itemId, index) => ({
      itemId,
      quantity: 1,
      unlockedAt: Date.now() + index
    })))
  })
}

export async function exportDatabase(): Promise<ExportPayload> {
  const [sessions, tasks, inventory, settings, meta] = await Promise.all([
    db.sessions.toArray(),
    db.tasks.toArray(),
    db.inventory.toArray(),
    db.settings.get('settings'),
    db.meta.get('app')
  ])
  if (!settings || !meta) throw new Error('DB_UNINITIALIZED')
  const exportSettings: AppSettings = settings.sound === 'custom'
    ? { ...settings, sound: 'off', customSoundId: undefined }
    : { ...settings, customSoundId: undefined }
  return { version: 2, exportedAt: Date.now(), sessions, tasks, inventory, settings: exportSettings, meta: { ...meta, schemaVersion: 2 } }
}

export async function importDatabase(payload: ExportPayload | LegacyExportPayload) {
  if (![1, 2].includes(payload.version) || !payload.meta || !payload.settings) throw new Error('UNSUPPORTED_DATA')
  const settings: AppSettings = {
    ...defaultSettings,
    ...payload.settings,
    sound: payload.settings.sound === 'custom' ? 'off' : payload.settings.sound,
    customSoundId: undefined
  }
  await db.transaction('rw', [db.sessions, db.tasks, db.inventory, db.settings, db.meta], async () => {
    await Promise.all([db.sessions.clear(), db.tasks.clear(), db.inventory.clear(), db.settings.clear(), db.meta.clear()])
    await db.sessions.bulkPut(payload.sessions)
    await db.tasks.bulkPut(payload.tasks)
    await db.inventory.bulkPut(payload.inventory)
    await db.settings.put(settings)
    await db.meta.put({ ...payload.meta, schemaVersion: 2, activeSessionId: undefined })
  })
}

export async function resetDatabase() {
  await db.delete()
  await db.open()
  await seedDatabase()
}
