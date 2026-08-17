import Dexie, { type EntityTable } from 'dexie'
import { zhCN } from '../i18n/zh-CN'
import type { AppMeta, AppSettings, ExportPayload, FocusSession, FocusTask, InventoryEntry } from '../types'

export class FocusDatabase extends Dexie {
  sessions!: EntityTable<FocusSession, 'id'>
  tasks!: EntityTable<FocusTask, 'id'>
  inventory!: EntityTable<InventoryEntry, 'itemId'>
  settings!: EntityTable<AppSettings, 'id'>
  meta!: EntityTable<AppMeta, 'id'>

  constructor() {
    super('focus-cottage-db')
    this.version(1).stores({
      sessions: 'id, status, startedAt, endedAt, taskId',
      tasks: 'id, completed, createdAt, dueDate',
      inventory: 'itemId, unlockedAt',
      settings: 'id',
      meta: 'id'
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
  schemaVersion: 1,
  activeTaskId: 'task-research'
}

const starterTasks: FocusTask[] = [
  { id: 'task-research', title: zhCN.starterTasks[0], completed: false, createdAt: Date.now() - 3000, dueDate: new Date().toISOString().slice(0, 10), focusMinutes: 0 },
  { id: 'task-assets', title: zhCN.starterTasks[1], completed: false, createdAt: Date.now() - 2000, dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), focusMinutes: 0 },
  { id: 'task-reading', title: zhCN.starterTasks[2], completed: false, createdAt: Date.now() - 1000, focusMinutes: 0 }
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
  if (!settings || !meta) throw new Error(zhCN.system.dbUninitialized)
  return { version: 1, exportedAt: Date.now(), sessions, tasks, inventory, settings, meta }
}

export async function importDatabase(payload: ExportPayload) {
  if (payload.version !== 1 || !payload.meta || !payload.settings) throw new Error(zhCN.system.unsupportedData)
  await db.transaction('rw', [db.sessions, db.tasks, db.inventory, db.settings, db.meta], async () => {
    await Promise.all([db.sessions.clear(), db.tasks.clear(), db.inventory.clear(), db.settings.clear(), db.meta.clear()])
    await db.sessions.bulkPut(payload.sessions)
    await db.tasks.bulkPut(payload.tasks)
    await db.inventory.bulkPut(payload.inventory)
    await db.settings.put(payload.settings)
    await db.meta.put({ ...payload.meta, activeSessionId: undefined })
  })
}

export async function resetDatabase() {
  await db.delete()
  await db.open()
  await seedDatabase()
}
