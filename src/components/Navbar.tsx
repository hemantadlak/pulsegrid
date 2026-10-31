import { Bell, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../context'
import { Logo } from './Logo'
import { t } from '../i18n'
import { LiveClock } from './ui/LiveClock'
import { GlobalSearch } from './layout/GlobalSearch'

export function Navbar({ onRequestSignOut }: { onRequestSignOut: () => void }) {
  const { role, lang, setLang } = useApp()
  const [unreadNotifications, setUnreadNotifications] = useState(3)

  useEffect(() => {
    const clearUnread = () => setUnreadNotifications(0)
    window.addEventListener('pulsegrid:coordinator-alerts-read', clearUnread)
    return () => window.removeEventListener('pulsegrid:coordinator-alerts-read', clearUnread)
  }, [])

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

        {role === 'coordinator' && <button className={`notification-bell ${unreadNotifications ? 'has-unread' : ''}`} onClick={() => window.dispatchEvent(new Event('pulsegrid:open-coordinator-alerts'))} aria-label={`Notifications — ${unreadNotifications} unread`}><Bell size={18} />{unreadNotifications > 0 && <span>{unreadNotifications}</span>}</button>}

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
