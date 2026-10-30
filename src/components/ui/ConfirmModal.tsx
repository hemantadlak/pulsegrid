import { AlertTriangle, CheckCircle2, LogOut, Truck, X } from 'lucide-react'

type Variant = 'ambulance' | 'accept' | 'redirect' | 'signout'
const config = {
  ambulance: { icon: Truck, title: 'Confirm ambulance request', text: 'A simulated ambulance will be assigned to this simulation request.', confirm: 'Request ambulance', tone: 'danger' },
  accept: { icon: CheckCircle2, title: 'Accept incoming patient', text: 'Confirm that your fictional hospital is ready to prepare the required facilities.', confirm: 'Accept patient', tone: 'success' },
  redirect: { icon: AlertTriangle, title: 'Reject incoming patient', text: 'The simulation will recommend the next eligible fictional hospital.', confirm: 'Reject & reroute', tone: 'danger' },
  signout: { icon: LogOut, title: 'Sign out', text: 'You will return to the role selection screen.', confirm: 'Sign out', tone: 'neutral' },
}

export function ConfirmModal({ variant, onConfirm, onClose }: { variant: Variant; onConfirm: () => void; onClose: () => void }) {
  const item = config[variant]
  const Icon = item.icon
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
      <div className={`icon-container icon-xl icon-${item.tone === 'danger' ? 'red' : item.tone === 'success' ? 'green' : 'gray'}`}><Icon size={25} /></div>
      <h2 id="confirm-title">{item.title}</h2><p>{item.text}</p>
      <div className="modal-actions"><button className="btn-outline" onClick={onClose}>Cancel</button><button className={item.tone === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{item.confirm}</button></div>
    </section>
  </div>
}
