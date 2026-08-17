import { Pencil, Pause, Play, Trash2, Upload, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatFileSize } from '../lib/customAudio'
import { useApp } from '../state/AppContext'

export function AmbientSound() {
  const {
    settings, m, customSounds, ambientStatus, ambientError, updateSettings, selectSound,
    pauseAmbient, resumeAmbient, addCustomSound, renameCustomSound, deleteCustomSound
  } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const active = settings.sound !== 'off'
  useEffect(() => setError(''), [settings.locale])
  const statusLabel = ambientError === 'blocked' ? m.system.audioBlocked
    : ambientError === 'unsupported' ? m.system.audioUnsupported
      : ambientStatus === 'playing' ? m.focus.playing : ambientStatus === 'paused' ? m.focus.paused : m.focus.sound

  const handleUpload = async (file?: File) => {
    if (!file) return
    setError('')
    try { await addCustomSound(file); setLibraryOpen(true) }
    catch (reason) { setError(reason instanceof Error ? reason.message : m.system.audioUnsupported) }
  }

  const togglePlayback = () => {
    if (!active) void selectSound('rain')
    else if (ambientStatus === 'playing') pauseAmbient()
    else resumeAmbient()
  }

  return (
    <div className={`ambient-control ${mobileOpen ? 'open' : ''}`}>
      <button className="ambient-drawer-toggle" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
        {active ? <Volume2 /> : <VolumeX />}<span>{m.focus.soundSettings}</span><span aria-hidden="true">⌄</span>
      </button>
      <div className="ambient-panel">
        <button className={active ? 'ambient-main active' : 'ambient-main'} onClick={togglePlayback} aria-label={ambientStatus === 'playing' ? m.focus.pauseAudio : m.focus.resumeAudio}>
          {ambientStatus === 'playing' ? <Pause /> : active ? <Play /> : <VolumeX />}
          <span><strong>{m.focus.sound}</strong><small>{statusLabel}</small></span>
        </button>
        <div className="ambient-options" aria-label={m.focus.soundChoice}>
          <button className={settings.sound === 'off' ? 'selected' : ''} onClick={() => selectSound('off')}>{m.focus.off}</button>
          <button className={settings.sound === 'rain' ? 'selected' : ''} onClick={() => selectSound('rain')}>{m.focus.rain}</button>
          <button className={settings.sound === 'purr' ? 'selected' : ''} onClick={() => selectSound('purr')}>{m.focus.purr}</button>
          <button className={settings.sound === 'custom' ? 'selected' : ''} onClick={() => setLibraryOpen((open) => !open)}>{m.focus.custom}</button>
        </div>
        <input aria-label={m.focus.volume} type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(event) => updateSettings({ volume: Number(event.target.value) })} />

        {libraryOpen && (
          <section className="audio-library" aria-label={m.focus.audioLibrary}>
            <div className="audio-library-heading">
              <span><strong>{m.focus.audioLibrary}</strong><small>{m.focus.audioLibraryHint}</small></span>
              <button className="audio-upload-button" onClick={() => fileRef.current?.click()}><Upload />{m.focus.uploadAudio}</button>
            </div>
            <input ref={fileRef} className="sr-only" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" onChange={(event) => {
              void handleUpload(event.target.files?.[0]); event.target.value = ''
            }} />
            {customSounds.length === 0 ? <p className="audio-empty">{m.focus.noCustomAudio}</p> : (
              <div className="audio-list">
                {customSounds.map((sound) => (
                  <div className={`audio-row ${settings.customSoundId === sound.id ? 'selected' : ''}`} key={sound.id}>
                    <button className="audio-select" onClick={() => selectSound('custom', sound.id)}>
                      {settings.customSoundId === sound.id && ambientStatus === 'playing' ? <Volume2 /> : <Play />}
                      <span><strong>{sound.name}</strong><small>{formatFileSize(sound.size, settings.locale)}</small></span>
                    </button>
                    <button className="audio-icon-button" aria-label={m.common.rename} onClick={() => {
                      const name = window.prompt(m.focus.renameAudioPrompt, sound.name)
                      if (name) void renameCustomSound(sound.id, name)
                    }}><Pencil /></button>
                    <button className="audio-icon-button delete" aria-label={m.common.delete} onClick={() => {
                      if (window.confirm(m.focus.deleteAudioConfirm)) void deleteCustomSound(sound.id)
                    }}><Trash2 /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {error && <p className="ambient-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}
