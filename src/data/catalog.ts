import type { CatalogItem } from '../types'
import { zhCN } from '../i18n/zh-CN'

const itemNames = zhCN.collection.items

export const catalog: CatalogItem[] = [
  { id: 'plant', name: itemNames.plant, rarity: 'common', price: 15, slot: 'leftDecor', image: '/assets/art/item-plant.png' },
  { id: 'vase', name: itemNames.vase, rarity: 'rare', price: 25, slot: 'rightDecor', image: '/assets/art/item-vase.png' },
  { id: 'cushion', name: itemNames.cushion, rarity: 'common', price: 15, slot: 'cushion', image: '/assets/art/item-cushion.png' },
  { id: 'rug', name: itemNames.rug, rarity: 'rare', price: 25, slot: 'rug', image: '/assets/art/item-rug.png' },
  { id: 'frame', name: itemNames.frame, rarity: 'common', price: 15, slot: 'leftDecor', image: '/assets/art/item-frame.png' },
  { id: 'plane', name: itemNames.plane, rarity: 'common', price: 15, slot: 'rightDecor', image: '/assets/art/item-plane.png' },
  { id: 'mug', name: itemNames.mug, rarity: 'rare', price: 25, slot: 'rightDecor', image: '/assets/art/item-mug.png' },
  { id: 'lamp', name: itemNames.lamp, rarity: 'special', price: 40, slot: 'leftDecor', image: '/assets/art/item-lamp.png' }
]

export const catalogById = Object.fromEntries(catalog.map((item) => [item.id, item]))

export const rarityLabel = zhCN.collection.rarity
