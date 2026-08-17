import { Bell, Download, RotateCcw, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { zhCN } from '../i18n/zh-CN'

export function SettingsModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const { settings, updateSettings, requestNotifications, downloadExport, restoreImport, resetAll } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [noticeStatus, setNoticeStatus] = useState('')
  if (!open) return null

  const confirmReset = async () => {
    if (window.confirm(zhCN.settings.resetConfirm)) await resetAll()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button className="modal-close" onClick={onClose} aria-label={zhCN.common.close}><X /></button>
        <h2 id="settings-title">{zhCN.settings.title}</h2>
        <div className="setting-row">
          <label htmlFor="focus-length">{zhCN.settings.focusLength}</label>
          <select id="focus-length" value={settings.pomodoroMinutes} onChange={(event) => updateSettings({ pomodoroMinutes: Number(event.target.value) })}>
            {[15, 25, 45, 60].map((value) => <option value={value} key={value}>{zhCN.common.minuteAmount(value)}</option>)}
          </select>
        </div>
        <div className="setting-row">
          <label htmlFor="motion-toggle">{zhCN.settings.reduceMotion}</label>
          <input id="motion-toggle" type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} />
        </div>
        <div className="setting-actions">
          <button className="secondary-button" onClick={async () => {
            const status = await requestNotifications()
            setNoticeStatus(status === 'granted' ? zhCN.settings.notificationOn : status === 'unsupported' ? zhCN.settings.notificationUnsupported : zhCN.settings.notificationOff)
          }}><Bell /> {zhCN.settings.notification}</button>
          {noticeStatus && <span className="setting-hint">{noticeStatus}</span>}
          <button className="secondary-button" onClick={downloadExport}><Download /> {zhCN.settings.export}</button>
          <button className="secondary-button" onClick={() => fileRef.current?.click()}><Upload /> {zhCN.settings.import}</button>
          <input ref={fileRef} className="sr-only" type="file" accept="application/json" onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) await restoreImport(file)
            event.target.value = ''
          }} />
          <button className="danger-button" onClick={confirmReset}><RotateCcw /> {zhCN.settings.reset}</button>
        </div>
        <p className="privacy-note">{zhCN.settings.privacy}</p>
      </section>
    </div>
  )
}
