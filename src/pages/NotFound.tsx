import { Truck } from 'lucide-react'
import { Logo } from '../components/Logo'

export function NotFound() {
  return <main className="not-found"><strong>404</strong><Logo size="lg" /><h1>Page not found</h1><p>The dispatch route you are looking for does not exist.</p><button className="btn-primary return-home" onClick={() => { window.location.href = '/' }}>Return to dashboard</button><Truck size={32} /></main>
}
