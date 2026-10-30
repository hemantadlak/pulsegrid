import { WifiOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const onOnline = () => { setOnline(true); window.setTimeout(() => setDismissed(true), 3000) }
    const onOffline = () => { setDismissed(false); setOnline(false) }
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])
  if (online || dismissed) return null
  return <div className="offline-banner" role="status" aria-live="polite"><WifiOff size={17} /> No internet connection — some simulation features may not work <button aria-label="Dismiss offline notice" onClick={() => setDismissed(true)}><X size={16} /></button></div>
}
