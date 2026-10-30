import { Siren } from 'lucide-react'

export function SOSButton({ onActivate }: { onActivate: () => void }) {
  return <button className="sos-button" aria-label="Start simulated SOS support" onClick={onActivate} title="Start simulated SOS support">
    <span className="sos-ring" aria-hidden="true" />
    <Siren size={18} />
    <span>SOS</span>
  </button>
}
