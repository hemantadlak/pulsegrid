import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context'
import { ConfirmModal } from './ui/ConfirmModal'
import { PreparationChecklist } from './PreparationChecklist'
import { CONDITIONS } from '../conditions'

export function CoordinatorDashboard() {
  const { hospitals, auditLog, alerts, selectedConditionId, destinationId, journeyState, updateMetroStatus, recordHospitalDecision } = useApp()
  const metro = hospitals.find((hospital) => hospital.id === 'metro')!
  const [icuBeds, setIcuBeds] = useState(metro.icuBeds)
  const [specialistOn, setSpecialistOn] = useState(metro.cardiacSpecialist)
  const [erStatus, setErStatus] = useState(metro.erStatus)
  const [saved, setSaved] = useState(false)
  const [ventilators, setVentilators] = useState(2)
  const [bloodBank, setBloodBank] = useState<'full' | 'low' | 'critical'>('full')
  const [incomingHandled, setIncomingHandled] = useState(false)
  const [pendingDecision, setPendingDecision] = useState<'accept' | 'reject' | null>(null)
  const [showFullHistory, setShowFullHistory] = useState(false)

  useEffect(() => { setIcuBeds(metro.icuBeds); setSpecialistOn(metro.cardiacSpecialist); setErStatus(metro.erStatus) }, [metro])
  useEffect(() => { if (journeyState !== 'idle') setIncomingHandled(false) }, [journeyState, selectedConditionId])
  const incoming = journeyState !== 'idle' && !incomingHandled
  const condition = CONDITIONS.find((item) => item.id === selectedConditionId) ?? CONDITIONS[0]
  const destination = hospitals.find((hospital) => hospital.id === destinationId)
  const coordinatorAlerts = alerts.filter((alert) => alert.audience === 'coordinator' || alert.audience === 'all').slice(0, 2)
  const save = () => {
    updateMetroStatus({ icuBeds, cardiacSpecialist: specialistOn, erStatus })
    setSaved(true); window.setTimeout(() => setSaved(false), 2600)
  }
  const resolveIncoming = (accepted: boolean) => { recordHospitalDecision(accepted, 'ICU capacity unavailable'); setIncomingHandled(true); setPendingDecision(null); accepted ? toast.success('Thank you! The patient is arriving in a few minutes. Please arrange all facilities.') : toast.error('No worries — the patient has been rerouted.') }

  return <div className="grid-50-50">
    <div className="stack">
      <section id="dashboard" className="card">
        <p className="eyebrow">Hospital coordinator · live simulation sync</p>
        <h1>Metro Care Centre</h1>
        <p className="muted-copy">Update fictional resource availability. Saving changes immediately update open PULSEGRID simulation tabs and trigger a destination reassessment when a journey is active.</p>
        <div className="status-summary"><span className="badge badge-blue">ICU: {icuBeds} beds</span><span className={`badge ${specialistOn ? 'badge-green' : 'badge-red'}`}>Cardiac specialist: {specialistOn ? 'available' : 'unavailable'}</span></div>
      </section>

      <section id="capacity" className="card">
        <p className="eyebrow">Readiness controls</p>
        <div className="data-row"><span>ICU beds available</span><div className="counter-wrap">
          <button id="icu-minus" className="counter-btn" aria-label="Decrease ICU bed count" onClick={() => setIcuBeds((value) => Math.max(0, value - 1))}><Minus size={15} /></button>
          <strong className="counter-value">{icuBeds}</strong>
          <button id="icu-plus" className="counter-btn" aria-label="Increase ICU bed count" onClick={() => setIcuBeds((value) => Math.min(8, value + 1))}><Plus size={15} /></button>
        </div></div>
        <div className="data-row"><span>Cardiac specialist available</span><label className="toggle-switch"><input type="checkbox" checked={specialistOn} onChange={(event) => setSpecialistOn(event.target.checked)} /><span className="toggle-slider" /></label></div>
        <div className="data-row"><span>Ventilators available</span><div className="counter-wrap"><button className="counter-btn" onClick={() => setVentilators((value) => Math.max(0, value - 1))}><Minus size={15} /></button><strong className="counter-value">{ventilators}</strong><button className="counter-btn" onClick={() => setVentilators((value) => Math.min(8, value + 1))}><Plus size={15} /></button></div></div>
        <div className="data-row column-row"><span>Emergency room status</span><div className="seg-control">{(['accepting', 'limited', 'diverting'] as const).map((value) => <button key={value} className={`seg-btn ${erStatus === value ? 'active' : ''}`} onClick={() => setErStatus(value)}>{value}</button>)}</div></div>
        <div className="data-row column-row"><span>Blood bank status</span><div className="seg-control">{(['full', 'low', 'critical'] as const).map((value) => <button key={value} className={`seg-btn ${bloodBank === value ? 'active' : ''}`} onClick={() => setBloodBank(value)}>{value}</button>)}</div></div>
        <button id="update-status-btn" className="btn-primary" onClick={save}>{saved ? 'Status saved' : 'Update simulation status'}</button>
      </section>

      <section className="card quick-simulation">
        <p className="eyebrow">Reroute scenario</p>
        <p>Set ICU beds to <strong>0</strong> and save while the Emergency User journey is active to trigger the live fictional reroute flow.</p>
      </section>
      {incoming && <section className="card incoming-card"><p className="eyebrow">{coordinatorAlerts.length ? 'New fictional SOS request' : 'Incoming simulated patient'}</p><h3>{condition.name} · Simulation ambulance · ETA {destination?.etaMinutes ?? 7} min</h3><p className="muted-copy">Preparation required: {condition.requiredFacilities.join(', ')}.</p><div className="button-row"><button className="btn-primary compact-btn" onClick={() => setPendingDecision('accept')}>Accept simulated patient</button><button className="btn-outline compact-btn" onClick={() => setPendingDecision('reject')}>Reject — lack of resources</button></div></section>}
      {incoming && <PreparationChecklist />}
    </div>

    <section className="card live-alert-card" aria-live="polite"><p className="eyebrow">Live alerts</p>{coordinatorAlerts.length ? coordinatorAlerts.map((alert) => <div className="live-alert-item" key={alert.id}><span className={`audit-bar audit-${alert.tone}`} /><div><strong>{alert.text}</strong><small>{alert.time} · Simulation</small></div></div>) : <p className="muted-copy">New fictional SOS requests will be shown here.</p>}</section>
    <section id="eventlog" className="card">
      <p className="eyebrow">Shared simulation audit log</p>
      {auditLog.length === 0 ? <p className="muted-copy">Start an Emergency User journey first, then return here to change ICU capacity.</p> : <>{(showFullHistory ? auditLog : auditLog.slice(0, 3)).map((event) => <div className="audit-item" key={event.id}>
        <span className={`audit-bar audit-${event.tone}`} /><div><strong>{event.text}</strong><small>{event.time} · Simulation</small></div>
      </div>)}{auditLog.length > 3 && <button className="show-more-btn history-btn" onClick={() => setShowFullHistory((show) => !show)}>{showFullHistory ? 'Show recent activity' : `Show full history (${auditLog.length})`}</button>}</>}
    </section>
    <section id="settings-panel" className="card coordinator-settings"><p className="eyebrow">Display settings</p><p className="muted-copy">Use the English/Hindi control in the navigation bar to change the interface language.</p></section>
    {pendingDecision && <ConfirmModal variant={pendingDecision === 'accept' ? 'accept' : 'redirect'} onClose={() => setPendingDecision(null)} onConfirm={() => resolveIncoming(pendingDecision === 'accept')} />}
  </div>
}
