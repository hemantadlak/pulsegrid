import { useEffect, useState } from 'react'

export function useCountdown(minutes = 7, seconds = 42) {
  const [total, setTotal] = useState(minutes * 60 + seconds)
  useEffect(() => {
    const interval = window.setInterval(() => setTotal((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [])
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
