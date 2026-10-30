import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])
  return <time className="live-clock">{format(now, 'EEE, dd MMM · HH:mm:ss')}</time>
}
