import { catalogById } from '../data/catalog'
import { useApp } from '../state/AppContext'
import { zhCN } from '../i18n/zh-CN'

export type CatState = 'idle' | 'focus' | 'success' | 'abandoned'

const catImages: Record<CatState, string> = {
  idle: '/assets/art/cat-idle.png',
  focus: '/assets/art/cat-focus.png',
  success: '/assets/art/cat-success.png',
  abandoned: '/assets/art/cat-abandoned.png'
}

export function RoomScene({ catState = 'idle', compact = false }: { catState?: CatState; compact?: boolean }) {
  const { meta } = useApp()
  const layout = meta.roomLayout
  const imageFor = (id?: string) => id ? catalogById[id]?.image : undefined

  return (
    <div className={`room-scene ${compact ? 'compact' : ''}`} aria-label={zhCN.room.label}>
      <img className="room-background" src="/assets/art/room-background.png" alt={zhCN.room.background} />
      {imageFor(layout.rug) && <img className="room-item room-rug" src={imageFor(layout.rug)} alt="" />}
      {imageFor(layout.cushion) && <img className="room-item room-cushion" src={imageFor(layout.cushion)} alt="" />}
      {imageFor(layout.leftDecor) && <img className="room-item room-left-decor" src={imageFor(layout.leftDecor)} alt="" />}
      {imageFor(layout.rightDecor) && <img className="room-item room-right-decor" src={imageFor(layout.rightDecor)} alt="" />}
      <img className={`room-cat cat-${catState}`} src={catImages[catState]} alt={catState === 'focus' ? zhCN.room.focusCat : zhCN.room.idleCat} />
    </div>
  )
}
