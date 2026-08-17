import { catalogById } from '../data/catalog'
import { useApp } from '../state/AppContext'

export type CatState = 'idle' | 'focus' | 'success' | 'abandoned'

const catImages: Record<CatState, string> = {
  idle: '/assets/art/cat-idle.png',
  focus: '/assets/art/cat-focus.png',
  success: '/assets/art/cat-success.png',
  abandoned: '/assets/art/cat-abandoned.png'
}

export function RoomScene({ catState = 'idle', compact = false }: { catState?: CatState; compact?: boolean }) {
  const { meta, m } = useApp()
  const layout = meta.roomLayout
  const imageFor = (id?: string) => id ? catalogById[id]?.image : undefined

  return (
    <div className={`room-scene ${compact ? 'compact' : ''}`} aria-label={m.room.label}>
      <img className="room-background" src="/assets/art/room-background.png" alt={m.room.background} />
      {/* The starter rug is painted into the background so it stays beneath the chair. */}
      {imageFor(layout.cushion) && <img className="room-item room-cushion" src={imageFor(layout.cushion)} alt="" />}
      {imageFor(layout.leftDecor) && <img className="room-item room-left-decor" src={imageFor(layout.leftDecor)} alt="" />}
      {imageFor(layout.rightDecor) && <img className="room-item room-right-decor" src={imageFor(layout.rightDecor)} alt="" />}
      <img className={`room-cat cat-${catState}`} src={catImages[catState]} alt={catState === 'focus' ? m.room.focusCat : m.room.idleCat} />
    </div>
  )
}
