import type { CatalogItem } from '../types'

export const catalog: CatalogItem[] = [
  { id: 'plant', rarity: 'common', price: 15, slot: 'leftDecor', image: '/assets/art/item-plant.png' },
  { id: 'vase', rarity: 'rare', price: 25, slot: 'rightDecor', image: '/assets/art/item-vase.png' },
  { id: 'cushion', rarity: 'common', price: 15, slot: 'cushion', image: '/assets/art/item-cushion.png' },
  { id: 'rug', rarity: 'rare', price: 25, slot: 'rug', image: '/assets/art/item-rug.png' },
  { id: 'frame', rarity: 'common', price: 15, slot: 'leftDecor', image: '/assets/art/item-frame.png' },
  { id: 'plane', rarity: 'common', price: 15, slot: 'rightDecor', image: '/assets/art/item-plane.png' },
  { id: 'mug', rarity: 'rare', price: 25, slot: 'rightDecor', image: '/assets/art/item-mug.png' },
  { id: 'lamp', rarity: 'special', price: 40, slot: 'leftDecor', image: '/assets/art/item-lamp.png' }
]

export const catalogById = Object.fromEntries(catalog.map((item) => [item.id, item]))
