import { describe, expect, it } from 'vitest'
import { fishForMinutes, pickReward, rarityWeights } from './rewards'

describe('reward rules', () => {
  it('calculates one fish per five started minutes with a 1-12 cap', () => {
    expect(fishForMinutes(1)).toBe(1)
    expect(fishForMinutes(6)).toBe(2)
    expect(fishForMinutes(60)).toBe(12)
    expect(fishForMinutes(180)).toBe(12)
  })

  it('uses the specified duration rarity bands', () => {
    expect(rarityWeights(29)).toEqual({ common: 80, rare: 18, special: 2 })
    expect(rarityWeights(30)).toEqual({ common: 65, rare: 30, special: 5 })
    expect(rarityWeights(60)).toEqual({ common: 50, rare: 40, special: 10 })
  })

  it('maps probability boundaries to the correct rarity', () => {
    const common = pickReward(25, (() => {
      const values = [0.1, 0]
      return () => values.shift() ?? 0
    })())
    const rare = pickReward(25, (() => {
      const values = [0.81, 0]
      return () => values.shift() ?? 0
    })())
    const special = pickReward(25, (() => {
      const values = [0.99, 0]
      return () => values.shift() ?? 0
    })())
    expect(common.rarity).toBe('common')
    expect(rare.rarity).toBe('rare')
    expect(special.rarity).toBe('special')
  })
})
