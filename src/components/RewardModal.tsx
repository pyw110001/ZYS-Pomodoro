import { Check, Fish, X } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { zhCN } from '../i18n/zh-CN'

export function RewardModal() {
  const { completion, clearCompletion } = useApp()
  if (!completion) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && clearCompletion()}>
      <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title">
        <button className="modal-close" onClick={clearCompletion} aria-label={zhCN.common.close}><X /></button>
        <div className="reward-check"><Check /></div>
        <h2 id="reward-title">{zhCN.reward.title}</h2>
        <p className="reward-duration">{zhCN.common.minuteAmount(completion.elapsedMinutes)}</p>
        <div className="reward-divider" />
        <img src={completion.item.image} alt={completion.item.name} className="reward-art" />
        <h3>{completion.item.name}</h3>
        <p>{zhCN.reward.helper}</p>
        <div className="reward-fish"><Fish /> +{zhCN.common.fishAmount(completion.fishDelta)}</div>
        {completion.duplicate && <p className="duplicate-note">{zhCN.reward.duplicate}</p>}
        <button className="primary-button reward-action" onClick={clearCompletion}>{zhCN.reward.accept}</button>
        <button className="text-button" onClick={clearCompletion}>{zhCN.reward.records}</button>
      </section>
    </div>
  )
}
