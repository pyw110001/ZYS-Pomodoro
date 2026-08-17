import { Check, Fish, X } from 'lucide-react'
import { useApp } from '../state/AppContext'

export function RewardModal() {
  const { completion, clearCompletion, m, catalogName } = useApp()
  if (!completion) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && clearCompletion()}>
      <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title">
        <button className="modal-close" onClick={clearCompletion} aria-label={m.common.close}><X /></button>
        <div className="reward-check"><Check /></div>
        <h2 id="reward-title">{m.reward.title}</h2>
        <p className="reward-duration">{m.common.minuteAmount(completion.elapsedMinutes)}</p>
        <div className="reward-divider" />
        <img src={completion.item.image} alt={catalogName(completion.item.id)} className="reward-art" />
        <h3>{catalogName(completion.item.id)}</h3>
        <p>{m.reward.helper}</p>
        <div className="reward-fish"><Fish /> +{m.common.fishAmount(completion.fishDelta)}</div>
        {completion.duplicate && <p className="duplicate-note">{m.reward.duplicate}</p>}
        <button className="primary-button reward-action" onClick={clearCompletion}>{m.reward.accept}</button>
        <button className="text-button" onClick={clearCompletion}>{m.reward.records}</button>
      </section>
    </div>
  )
}
