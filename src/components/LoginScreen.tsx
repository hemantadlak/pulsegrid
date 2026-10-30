import { useState } from 'react'
import { Ambulance, Building2 } from 'lucide-react'
import { useApp } from '../context'
import { Logo } from './Logo'
import { t } from '../i18n'
import type { Role } from '../context'

export function LoginScreen() {
  const { setRole, lang } = useApp()
  const [selected, setSelected] = useState<Role>(null)

  const handleEnter = () => {
    if (selected) setRole(selected)
  }

  return (
    <div
      className="dot-grid-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Login card */}
      <div
        className="card"
        style={{
          width: 480,
          padding: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          // no transform on hover for login card
          transform: 'none',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = 'none')}
      >
        {/* Logo + tagline */}
        <Logo size="lg" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
          {t('tagline', lang)}
        </p>

        <div className="divider" />

        {/* Role selection */}
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          {t('selectRole', lang)}
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {/* Emergency User */}
          <div
            className={`role-card${selected === 'emergency' ? ' selected-red' : ''}`}
            onClick={() => setSelected('emergency')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelected('emergency')}
          >
            <Ambulance size={28} color="var(--accent-red)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                {t('emergencyUser', lang)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {t('emergencyUserSub', lang)}
              </div>
            </div>
          </div>

          {/* Hospital Coordinator */}
          <div
            className={`role-card${selected === 'coordinator' ? ' selected-blue' : ''}`}
            onClick={() => setSelected('coordinator')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelected('coordinator')}
          >
            <Building2 size={28} color="var(--accent-blue)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                {t('hospitalCoordinator', lang)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {t('hospitalCoordinatorSub', lang)}
              </div>
            </div>
          </div>
        </div>

        {/* Enter button */}
        <button
          id="enter-demo-btn"
          className="btn-primary"
          disabled={!selected}
          onClick={handleEnter}
        >
          {t('enterDemoMode', lang)}
        </button>

        {/* Fine print */}
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 11,
            marginTop: 12,
          }}
        >
          {t('noRealData', lang)}
        </p>
      </div>
    </div>
  )
}
