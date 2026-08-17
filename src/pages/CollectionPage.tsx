import { Check, Fish, Gift, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RoomScene } from '../components/RoomScene'
import { catalog, rarityLabel } from '../data/catalog'
import { useApp } from '../state/AppContext'
import type { RoomSlot } from '../types'
import { zhCN } from '../i18n/zh-CN'

const categories: { label: string; slots: RoomSlot[] }[] = [
  { label: zhCN.collection.rug, slots: ['rug'] },
  { label: zhCN.collection.cushion, slots: ['cushion'] },
  { label: zhCN.collection.decor, slots: ['leftDecor', 'rightDecor'] }
]

export function CollectionPage() {
  const { inventory, meta, exchangeItem, equipItem } = useApp()
  const [tab, setTab] = useState<'gifts' | 'room'>('room')
  const [category, setCategory] = useState(0)
  const [message, setMessage] = useState('')
  const ownedIds = useMemo(() => new Set(inventory.map((entry) => entry.itemId)), [inventory])
  const currentItems = catalog.filter((item) => categories[category].slots.includes(item.slot))
  const isEquipped = (itemId: string) => Object.values(meta.roomLayout).includes(itemId)

  const exchange = async (itemId: string) => {
    setMessage('')
    try { await exchangeItem(itemId); setMessage(zhCN.collection.exchanged) }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : zhCN.collection.exchangeError) }
  }

  return (
    <div className="collection-page page-content standard-page">
      <div className="page-heading-row"><h1>{zhCN.collection.title}</h1></div>
      <div className="collection-tabs">
        <button className={tab === 'gifts' ? 'selected' : ''} onClick={() => setTab('gifts')}>{zhCN.collection.gifts}</button>
        <button className={tab === 'room' ? 'selected' : ''} onClick={() => setTab('room')}>{zhCN.collection.room}</button>
      </div>

      {tab === 'room' ? (
        <div className="room-editor">
          <RoomScene catState="idle" compact />
          <aside className="item-rail">
            <div className="category-switch">
              {categories.map((entry, index) => <button key={entry.label} className={category === index ? 'selected' : ''} onClick={() => setCategory(index)}>{entry.label}</button>)}
            </div>
            <div className="item-rail-list">
              {currentItems.map((item) => {
                const owned = ownedIds.has(item.id)
                const equipped = isEquipped(item.id)
                return (
                  <button key={item.id} className={`item-row ${equipped ? 'selected' : ''}`} disabled={!owned} onClick={() => equipItem(item.id)}>
                    <img src={item.image} alt="" />
                    <span><strong>{item.name}</strong><small>{equipped ? zhCN.collection.equipped : owned ? zhCN.collection.owned : `${item.price} ${zhCN.common.fish}`}</small></span>
                    {equipped && <Check />}
                  </button>
                )
              })}
            </div>
            {message && <p className="catalog-message" role="status">{message}</p>}
            <button className="primary-button save-layout" onClick={() => setMessage(zhCN.collection.saved)}><Save />{zhCN.collection.saveLayout}</button>
          </aside>
        </div>
      ) : (
        <div className="gift-catalog">
          <div className="gift-intro"><Gift /><div><h2>{zhCN.collection.giftTitle}</h2><p>{zhCN.collection.giftIntro}</p></div></div>
          {message && <p className="catalog-message" role="status">{message}</p>}
          <div className="catalog-list">
            {catalog.map((item) => {
              const owned = ownedIds.has(item.id)
              return (
                <article key={item.id} className={`catalog-row ${owned ? 'owned' : ''}`}>
                  <img src={item.image} alt={item.name} />
                  <div><strong>{item.name}</strong><span>{rarityLabel[item.rarity]}</span></div>
                  {owned ? <span className="owned-label"><Check />{zhCN.collection.owned}</span> : <button onClick={() => exchange(item.id)}><Fish />{item.price}</button>}
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
