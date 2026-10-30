import { Bell, LogOut, X } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context'
import { Logo } from './Logo'
import { t } from '../i18n'
import { LiveClock } from './ui/LiveClock'
import { GlobalSearch } from './layout/GlobalSearch'

export function Navbar({ onRequestSignOut }: { onRequestSignOut: () => void }) {
  const { role, lang, setLang } = useApp()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const roleLabel =
    role === 'emergency'
      ? t('emergencyUser', lang)
      : role === 'coordinator'
      ? t('hospitalCoordinator', lang)
      : ''

  return (
    <nav className="navbar">
      <Logo size="md" />
      <LiveClock />
      <GlobalSearch />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {/* Language toggle */}
        <div className="lang-toggle">
          <button
            className={`lang-btn${lang === 'en' ? ' active' : ''}`}
            onClick={() => setLang('en')}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            className={`lang-btn${lang === 'hi' ? ' active' : ''}`}
            onClick={() => setLang('hi')}
            aria-label="Switch to Hindi"
          >
            HI
          </button>
        </div>

        {role === 'coordinator' && <>
          <button className="notification-bell" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifications — 1 unread"><Bell size={18} /><span>1</span></button>
          {notificationsOpen && <div className="notification-dropdown"><div className="notification-title">Incoming simulated patient <button onClick={() => setNotificationsOpen(false)}><X size={15} /></button></div><strong>Cardiac care request</strong><small>AMB-DEMO-07 · simulated ETA 7 min</small><p>Review the Incoming simulated patient card in the coordinator dashboard.</p></div>}
        </>}

        {/* Role badge */}
        {role && (
          <span
            className="badge"
            style={{
              background:
                role === 'emergency'
                  ? 'rgba(244,63,94,0.12)'
                  : 'rgba(56,189,248,0.12)',
              color:
                role === 'emergency' ? 'var(--accent-red)' : 'var(--accent-blue)',
            }}
          >
            {roleLabel}
          </span>
        )}

        {/* Sign out */}
        {role && (
          <button
            className="btn-outline"
            onClick={onRequestSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={14} />
            {t('signOut', lang)}
          </button>
        )}
      </div>
    </nav>
  )
}
