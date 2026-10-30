import { useState } from 'react'
import { AppProvider, useApp } from './context'
import { LoginScreen } from './components/LoginScreen'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { EmergencyDashboard } from './components/EmergencyDashboard'
import { CoordinatorDashboard } from './components/CoordinatorDashboard'

function AppContent() {
  const { role } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (!role) {
    return <LoginScreen />
  }

  return (
    <>
      <div className="sim-banner">Simulation only — no real emergency calls, ambulance tracking, patient data, or hospital availability are used.</div>

      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="main-layout">
        {role === 'emergency' ? (
          <EmergencyDashboard />
        ) : (
          <CoordinatorDashboard />
        )}
      </main>
      {role === 'emergency' && <button className="sos-button" onClick={() => document.getElementById('dispatch-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} title="Open simulated emergency request">SOS</button>}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
