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
    <aside className="sidebar">
      <div>
        {navItems.map(({ id, icon: Icon, label }) => (
          <div
            key={id}
            className={`sidebar-nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 20px', color: 'var(--text-secondary)', fontSize: 11 }}>
        v0.1 · Demo
      </div>
    </aside>
  )
}
