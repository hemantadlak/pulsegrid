import { Siren } from 'lucide-react'

export function SOSButton({ onActivate }: { onActivate: () => void }) {
  return <button className="sos-button" aria-label="Open SOS voice assistance" onClick={onActivate} title="Open SOS voice assistance">
    <span className="sos-ring" aria-hidden="true" />
    <Siren size={18} />
    <span>SOS</span>
  </button>
}
