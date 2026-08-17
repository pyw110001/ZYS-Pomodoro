import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { zhCN } from '../i18n/zh-CN'

export function AmbientSound() {
  const { settings, updateSettings } = useApp()
  const cleanupRef = useRef<(() => void) | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
    if (settings.sound === 'off') return
    const AudioContextType = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextType) return
    const context = new AudioContextType()
    const master = context.createGain()
    master.gain.value = settings.volume * 0.16
    master.connect(context.destination)

    if (settings.sound === 'rain') {
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
      const source = context.createBufferSource()
      const filter = context.createBiquadFilter()
      source.buffer = buffer; source.loop = true; filter.type = 'lowpass'; filter.frequency.value = 1400
      source.connect(filter).connect(master); source.start()
    } else {
      const oscillator = context.createOscillator()
      const lfo = context.createOscillator()
      const lfoGain = context.createGain()
      oscillator.type = 'sine'; oscillator.frequency.value = 68
      lfo.frequency.value = 4.2; lfoGain.gain.value = 0.35
      lfo.connect(lfoGain).connect(master.gain); oscillator.connect(master); oscillator.start(); lfo.start()
    }
    cleanupRef.current = () => void context.close()
    return () => cleanupRef.current?.()
  }, [settings.sound, settings.volume])

  return (
    <div className={`ambient-control ${mobileOpen ? 'open' : ''}`}>
      <button className="ambient-drawer-toggle" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
        {settings.sound === 'off' ? <VolumeX /> : <Volume2 />}<span>{zhCN.focus.soundSettings}</span><span aria-hidden="true">⌄</span>
      </button>
      <div className="ambient-panel">
        <button className={settings.sound === 'off' ? 'ambient-main' : 'ambient-main active'} onClick={() => updateSettings({ sound: settings.sound === 'off' ? 'rain' : 'off' })}>
          {settings.sound === 'off' ? <VolumeX /> : <Volume2 />}<span>{zhCN.focus.sound}</span>
        </button>
        <div className="ambient-options" aria-label={zhCN.focus.soundChoice}>
          <button className={settings.sound === 'rain' ? 'selected' : ''} onClick={() => updateSettings({ sound: 'rain' })}>{zhCN.focus.rain}</button>
          <button className={settings.sound === 'purr' ? 'selected' : ''} onClick={() => updateSettings({ sound: 'purr' })}>{zhCN.focus.purr}</button>
        </div>
        <input aria-label={zhCN.focus.volume} type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(event) => updateSettings({ volume: Number(event.target.value) })} />
      </div>
    </div>
  )
}
