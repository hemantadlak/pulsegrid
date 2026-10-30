import { Logo } from '../Logo'

export function AppLoader() {
  return <div className="app-loader" role="status" aria-live="polite">
    <Logo size="lg" />
    <p>Loading PULSEGRID…</p>
    <div className="loader-track"><span /></div>
  </div>
}
