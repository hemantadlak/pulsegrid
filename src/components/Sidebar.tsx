import { LayoutDashboard, Send, Building2, Bell, Settings } from 'lucide-react'
import { useApp } from '../context'
import { t } from '../i18n'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { role, lang } = useApp()

  const emergencyNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
    { id: 'dispatch',  icon: Send,            label: t('dispatch', lang) },
    { id: 'hospitals', icon: Building2,        label: t('hospitals', lang) },
    { id: 'alerts',    icon: Bell,             label: t('alerts', lang) },
    { id: 'settings',  icon: Settings,         label: t('settings', lang) },
  ]

  const coordinatorNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
    { id: 'capacity',  icon: Building2,        label: t('capacity', lang) },
    { id: 'eventlog',  icon: Bell,             label: t('eventLog', lang) },
    { id: 'settings',  icon: Settings,         label: t('settings', lang) },
  ]

  const navItems = role === 'coordinator' ? coordinatorNav : emergencyNav
  return (
    <nav className="top-navigation" aria-label="Workspace navigation">
      <div className="top-navigation-inner">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            type="button"
            key={id}
            className={`top-nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => onTabChange(id)}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={17} strokeWidth={2.25} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
