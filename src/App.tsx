import { lazy, Suspense, useEffect, useState } from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp } from './context'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { AppLoader } from './components/ui/AppLoader'
import { ConfirmModal } from './components/ui/ConfirmModal'
import { OfflineBanner } from './components/ui/OfflineBanner'
import { SOSButton } from './components/ui/SOSButton'
import { SOSVoiceDrawer } from './components/SOSVoiceDrawer'
const LoginScreen = lazy(async () => ({ default: (await import('./components/LoginScreen')).LoginScreen }))
const EmergencyDashboard = lazy(async () => ({ default: (await import('./components/EmergencyDashboard')).EmergencyDashboard }))
const CoordinatorDashboard = lazy(async () => ({ default: (await import('./components/CoordinatorDashboard')).CoordinatorDashboard }))
const NotFound = lazy(async () => ({ default: (await import('./pages/NotFound')).NotFound }))

function AppContent() {
  const { role, dispatch, signOut } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [sosVoiceOpen, setSosVoiceOpen] = useState(false)
  const openSosVoiceCapture = () => {
    setSosVoiceOpen(true)
    window.dispatchEvent(new Event('pulsegrid:start-sos-voice'))
  }
  if (!role) return <Suspense fallback={<AppLoader />}><LoginScreen /></Suspense>
  return <>
    <Helmet><title>{role === 'emergency' ? 'Emergency dashboard — PULSEGRID' : 'Hospital coordinator — PULSEGRID'}</title><meta name="description" content="PULSEGRID is a fictional emergency dispatch decision-support simulation." /><meta name="theme-color" content="#2563EB" /><link rel="canonical" href="https://pulsegrid-theta.vercel.app" /></Helmet>
    <div className="sim-banner">PULSEGRID <span>·</span> Simulation</div>
    <OfflineBanner />
    <Navbar onRequestSignOut={() => setSignOutOpen(true)} />
    <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
    <motion.main className="main-layout" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, ease: 'easeOut' }}>
      <Suspense fallback={<AppLoader />}>{role === 'emergency' ? <EmergencyDashboard /> : <CoordinatorDashboard />}</Suspense>
    </motion.main>
    {role === 'emergency' && <>
      <SOSButton onActivate={openSosVoiceCapture} />
      <SOSVoiceDrawer open={sosVoiceOpen} onClose={() => setSosVoiceOpen(false)} onAllocate={(conditionId) => dispatch({ helper: true, conditionId, source: 'sos-voice' })} />
    </>}
    {signOutOpen && <ConfirmModal variant="signout" onClose={() => setSignOutOpen(false)} onConfirm={() => { void signOut(); setSignOutOpen(false) }} />}
  </>
}

function App() {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 1200); return () => window.clearTimeout(timer) }, [])
  return <HelmetProvider>
    <Helmet><title>PULSEGRID — Emergency Dispatch Intelligence</title><meta name="description" content="Fictional emergency dispatch decision-support simulation." /><meta property="og:title" content="PULSEGRID" /><meta property="og:type" content="website" /></Helmet>
    {loading ? <AppLoader /> : window.location.pathname !== '/' ? <Suspense fallback={<AppLoader />}><NotFound /></Suspense> : <AppProvider><AppContent /></AppProvider>}
    <Toaster position="top-right" toastOptions={{ style: { background: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(15,23,42,0.12)', fontSize: '14px', fontWeight: '500', padding: '14px 16px' } }} />
  </HelmetProvider>
}

export default App
