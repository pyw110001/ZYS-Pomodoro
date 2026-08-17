import 'fake-indexeddb/auto'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db, exportDatabase, importDatabase, seedDatabase } from './db'

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

  it('creates schema version one and starter local data', async () => {
    expect(db.verno).toBe(1)
    expect(await db.tasks.count()).toBe(3)
    expect(await db.inventory.count()).toBe(4)
    expect((await db.meta.get('app'))?.fishBalance).toBe(128)
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
