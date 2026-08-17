import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db, exportDatabase, FocusDatabase, importDatabase, seedDatabase } from './db'
import type { LegacyExportPayload } from '../types'

describe('versioned local database', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    await seedDatabase()
  })

  afterAll(async () => {
    db.close()
    await db.delete()
  })

  it('creates schema version two with localizable starter data', async () => {
    expect(db.verno).toBe(2)
    expect(await db.tasks.count()).toBe(3)
    expect(await db.inventory.count()).toBe(4)
    expect((await db.meta.get('app'))?.fishBalance).toBe(128)
    expect((await db.tasks.get('task-research'))?.titleKey).toBe('research')
  })

  it('exports and imports JSON while clearing a stale active session', async () => {
    const payload = await exportDatabase()
    payload.meta.activeSessionId = 'stale-session'
    payload.meta.fishBalance = 37
    await importDatabase(payload)
    const restored = await db.meta.get('app')
    expect(restored?.fishBalance).toBe(37)
    expect(restored?.activeSessionId).toBeUndefined()
    expect(await db.tasks.count()).toBe(payload.tasks.length)
  })

  it('imports a version one JSON backup', async () => {
    const current = await exportDatabase()
    const legacy = { ...current, version: 1, settings: { ...current.settings, locale: 'zh-CN', sound: 'rain' } } as LegacyExportPayload
    await importDatabase(legacy)
    expect((await db.settings.get('settings'))?.sound).toBe('rain')
    expect((await db.meta.get('app'))?.schemaVersion).toBe(2)
  })

  it('migrates untouched starter tasks but preserves edited titles', async () => {
    const name = 'focus-cottage-migration-test'
    const legacy = new Dexie(name)
    legacy.version(1).stores({ sessions: 'id, status, startedAt, endedAt, taskId', tasks: 'id, completed, createdAt, dueDate', inventory: 'itemId, unlockedAt', settings: 'id', meta: 'id' })
    await legacy.open()
    await legacy.table('tasks').bulkPut([
      { id: 'task-research', title: '完成产品调研', completed: false, createdAt: 1, focusMinutes: 0 },
      { id: 'task-assets', title: '用户改过的标题', completed: false, createdAt: 2, focusMinutes: 0 }
    ])
    await legacy.table('meta').put({ id: 'app', fishBalance: 1, roomLayout: {}, schemaVersion: 1 })
    legacy.close()

    const migrated = new FocusDatabase(name)
    await migrated.open()
    expect((await migrated.tasks.get('task-research'))?.titleKey).toBe('research')
    expect((await migrated.tasks.get('task-assets'))?.titleKey).toBeUndefined()
    expect((await migrated.meta.get('app'))?.schemaVersion).toBe(2)
    migrated.close()
    await Dexie.delete(name)
  })

  it('keeps custom audio local and sanitizes an imported custom selection', async () => {
    await db.customSounds.put({ id: 'sound-one', name: 'Rain.wav', mimeType: 'audio/wav', size: 4, blob: new Blob(['test']), createdAt: 1 })
    await db.settings.update('settings', { sound: 'custom', customSoundId: 'sound-one' })
    const payload = await exportDatabase()
    expect(payload.settings.sound).toBe('off')
    expect(payload.settings.customSoundId).toBeUndefined()

    payload.settings.sound = 'custom'
    payload.settings.customSoundId = 'missing'
    await importDatabase(payload)
    expect((await db.settings.get('settings'))?.sound).toBe('off')
    expect(await db.customSounds.get('sound-one')).toBeDefined()
  })

  it('rolls back fish and inventory together when a transaction fails', async () => {
    await expect(db.transaction('rw', [db.meta, db.inventory], async () => {
      await db.meta.update('app', { fishBalance: 88 })
      await db.inventory.put({ itemId: 'transaction-test', quantity: 1, unlockedAt: Date.now() })
      throw new Error('simulated failure')
    })).rejects.toThrow('simulated failure')

    expect((await db.meta.get('app'))?.fishBalance).toBe(128)
    expect(await db.inventory.get('transaction-test')).toBeUndefined()
  })
})
