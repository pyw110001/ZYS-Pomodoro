import { Bell, Download, RotateCcw, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useApp } from '../state/AppContext'

export function SettingsModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const { settings, m, updateSettings, requestNotifications, downloadExport, restoreImport, resetAll } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [noticeStatus, setNoticeStatus] = useState<NotificationPermission | 'unsupported' | ''>('')
  const noticeLabel = noticeStatus === 'granted' ? m.settings.notificationOn : noticeStatus === 'unsupported' ? m.settings.notificationUnsupported : noticeStatus ? m.settings.notificationOff : ''
  if (!open) return null

  const confirmReset = async () => {
    if (window.confirm(m.settings.resetConfirm)) await resetAll()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button className="modal-close" onClick={onClose} aria-label={m.common.close}><X /></button>
        <h2 id="settings-title">{m.settings.title}</h2>
        <div className="setting-row">
          <label htmlFor="language-select">{m.settings.language}</label>
          <select id="language-select" value={settings.locale} onChange={(event) => updateSettings({ locale: event.target.value as 'zh-CN' | 'en-US' })}>
            <option value="zh-CN">{m.settings.chinese}</option><option value="en-US">{m.settings.english}</option>
          </select>
        </div>
        <div className="setting-row">
          <label htmlFor="focus-length">{m.settings.focusLength}</label>
          <select id="focus-length" value={settings.pomodoroMinutes} onChange={(event) => updateSettings({ pomodoroMinutes: Number(event.target.value) })}>
            {[15, 25, 45, 60].map((value) => <option value={value} key={value}>{m.common.minuteAmount(value)}</option>)}
          </select>
        </div>
        <div className="setting-row">
          <label htmlFor="motion-toggle">{m.settings.reduceMotion}</label>
          <input id="motion-toggle" type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} />
        </div>
        <div className="setting-actions">
          <button className="secondary-button" onClick={async () => {
            const status = await requestNotifications()
            setNoticeStatus(status)
          }}><Bell /> {m.settings.notification}</button>
          {noticeLabel && <span className="setting-hint">{noticeLabel}</span>}
          <button className="secondary-button" onClick={downloadExport}><Download /> {m.settings.export}</button>
          <button className="secondary-button" onClick={() => fileRef.current?.click()}><Upload /> {m.settings.import}</button>
          <input ref={fileRef} className="sr-only" type="file" accept="application/json" onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) await restoreImport(file)
            event.target.value = ''
          }} />
          <button className="danger-button" onClick={confirmReset}><RotateCcw /> {m.settings.reset}</button>
        </div>
        <p className="privacy-note">{m.settings.privacy}</p>
      </section>
    </div>
  )
}
