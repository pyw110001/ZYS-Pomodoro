import { Check, Fish, Gift, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { RoomScene } from '../components/RoomScene'
import { catalog } from '../data/catalog'
import { useApp } from '../state/AppContext'
import type { RoomSlot } from '../types'

export function CollectionPage() {
  const { inventory, meta, settings, m, catalogName, exchangeItem, equipItem } = useApp()
  const categories: { label: string; slots: RoomSlot[] }[] = [
    { label: m.collection.rug, slots: ['rug'] },
    { label: m.collection.cushion, slots: ['cushion'] },
    { label: m.collection.decor, slots: ['leftDecor', 'rightDecor'] }
  ]
  const [tab, setTab] = useState<'gifts' | 'room'>('room')
  const [category, setCategory] = useState(0)
  const [message, setMessage] = useState('')
  useEffect(() => setMessage(''), [settings.locale])
  const ownedIds = useMemo(() => new Set(inventory.map((entry) => entry.itemId)), [inventory])
  const currentItems = catalog.filter((item) => categories[category].slots.includes(item.slot))
  const isEquipped = (itemId: string) => Object.values(meta.roomLayout).includes(itemId)

  const exchange = async (itemId: string) => {
    setMessage('')
    try { await exchangeItem(itemId); setMessage(m.collection.exchanged) }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : m.collection.exchangeError) }
  }

  return (
    <div className="collection-page page-content standard-page">
      <div className="page-heading-row"><h1>{m.collection.title}</h1></div>
      <div className="collection-tabs">
        <button className={tab === 'gifts' ? 'selected' : ''} onClick={() => setTab('gifts')}>{m.collection.gifts}</button>
        <button className={tab === 'room' ? 'selected' : ''} onClick={() => setTab('room')}>{m.collection.room}</button>
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
                    <span><strong>{catalogName(item.id)}</strong><small>{equipped ? m.collection.equipped : owned ? m.collection.owned : `${item.price} ${m.common.fish}`}</small></span>
                    {equipped && <Check />}
                  </button>
                )
              })}
            </div>
            {message && <p className="catalog-message" role="status">{message}</p>}
            <button className="primary-button save-layout" onClick={() => setMessage(m.collection.saved)}><Save />{m.collection.saveLayout}</button>
          </aside>
        </div>
      ) : (
        <div className="gift-catalog">
          <div className="gift-intro"><Gift /><div><h2>{m.collection.giftTitle}</h2><p>{m.collection.giftIntro}</p></div></div>
          {message && <p className="catalog-message" role="status">{message}</p>}
          <div className="catalog-list">
            {catalog.map((item) => {
              const owned = ownedIds.has(item.id)
              return (
                <article key={item.id} className={`catalog-row ${owned ? 'owned' : ''}`}>
                  <img src={item.image} alt={catalogName(item.id)} />
                  <div><strong>{catalogName(item.id)}</strong><span>{m.collection.rarity[item.rarity]}</span></div>
                  {owned ? <span className="owned-label"><Check />{m.collection.owned}</span> : <button onClick={() => exchange(item.id)}><Fish />{item.price}</button>}
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
