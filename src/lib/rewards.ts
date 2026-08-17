import { catalog } from '../data/catalog'
import type { CatalogItem, Rarity } from '../types'

export const fishForMinutes = (minutes: number) => Math.max(1, Math.min(12, Math.ceil(minutes / 5)))

export const rarityWeights = (minutes: number): Record<Rarity, number> => {
  if (minutes >= 60) return { common: 50, rare: 40, special: 10 }
  if (minutes >= 30) return { common: 65, rare: 30, special: 5 }
  return { common: 80, rare: 18, special: 2 }
}

export const pickReward = (minutes: number, random = Math.random): CatalogItem => {
  const weights = rarityWeights(minutes)
  const roll = random() * 100
  const rarity: Rarity = roll < weights.common ? 'common' : roll < weights.common + weights.rare ? 'rare' : 'special'
  const pool = catalog.filter((item) => item.rarity === rarity)
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}
