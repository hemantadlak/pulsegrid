import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useApp } from '../context'

export function CoordinatorDashboard() {
  const { hospitals, auditLog, updateMetroStatus } = useApp()
  const metro = hospitals.find((hospital) => hospital.id === 'metro')!
  const [icuBeds, setIcuBeds] = useState(metro.icuBeds)
  const [specialistOn, setSpecialistOn] = useState(metro.cardiacSpecialist)
  const [erStatus, setErStatus] = useState(metro.erStatus)
  const [saved, setSaved] = useState(false)
  const [ventilators, setVentilators] = useState(2)
  const [bloodBank, setBloodBank] = useState<'full' | 'low' | 'critical'>('full')
  const [incoming, setIncoming] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { setIcuBeds(metro.icuBeds); setSpecialistOn(metro.cardiacSpecialist); setErStatus(metro.erStatus) }, [metro])
  const save = () => {
    updateMetroStatus({ icuBeds, cardiacSpecialist: specialistOn, erStatus })
    setSaved(true); setToast('Simulated hospital status updated'); window.setTimeout(() => { setSaved(false); setToast('') }, 2600)
  }
  const resolveIncoming = (accepted: boolean) => { setIncoming(false); setToast(accepted ? 'Simulated patient accepted — preparing bay' : 'Simulated patient redirected'); window.setTimeout(() => setToast(''), 2600) }

  return <div className="grid-50-50">
    <div className="stack">
      <section className="card">
        <p className="eyebrow">Hospital coordinator · simulated</p>
        <h1>Metro Care Centre</h1>
        <p className="muted-copy">Update fictional resource availability. Saving changes triggers a destination reassessment if a journey is active.</p>
        <div className="status-summary"><span className="badge badge-blue">ICU: {icuBeds} beds</span><span className={`badge ${specialistOn ? 'badge-green' : 'badge-red'}`}>Cardiac specialist: {specialistOn ? 'available' : 'unavailable'}</span></div>
      </section>

      <section className="card">
        <p className="eyebrow">Readiness controls</p>
        <div className="data-row"><span>ICU beds available</span><div className="counter-wrap">
          <button id="icu-minus" className="counter-btn" onClick={() => setIcuBeds((value) => Math.max(0, value - 1))}><Minus size={15} /></button>
          <strong className="counter-value">{icuBeds}</strong>
          <button id="icu-plus" className="counter-btn" onClick={() => setIcuBeds((value) => Math.min(8, value + 1))}><Plus size={15} /></button>
        </div></div>
        <div className="data-row"><span>Cardiac specialist available</span><label className="toggle-switch"><input type="checkbox" checked={specialistOn} onChange={(event) => setSpecialistOn(event.target.checked)} /><span className="toggle-slider" /></label></div>
        <div className="data-row"><span>Ventilators available</span><div className="counter-wrap"><button className="counter-btn" onClick={() => setVentilators((value) => Math.max(0, value - 1))}><Minus size={15} /></button><strong className="counter-value">{ventilators}</strong><button className="counter-btn" onClick={() => setVentilators((value) => Math.min(8, value + 1))}><Plus size={15} /></button></div></div>
        <div className="data-row column-row"><span>Emergency room status</span><div className="seg-control">{(['accepting', 'limited', 'diverting'] as const).map((value) => <button key={value} className={`seg-btn ${erStatus === value ? 'active' : ''}`} onClick={() => setErStatus(value)}>{value}</button>)}</div></div>
        <div className="data-row column-row"><span>Blood bank status</span><div className="seg-control">{(['full', 'low', 'critical'] as const).map((value) => <button key={value} className={`seg-btn ${bloodBank === value ? 'active' : ''}`} onClick={() => setBloodBank(value)}>{value}</button>)}</div></div>
        <button id="update-status-btn" className="btn-primary" onClick={save}>{saved ? 'Status saved' : 'Update simulated status'}</button>
      </section>

      <section className="card quick-demo">
        <p className="eyebrow">Demo trigger</p>
        <p>For the key demo, set ICU beds to <strong>0</strong> and save while the Emergency User journey is active.</p>
      </section>
      {incoming && <section className="card incoming-card"><p className="eyebrow">Incoming simulated patient</p><h3>Cardiac care · AMB-DEMO-07 · ETA 7 min</h3><p className="muted-copy">Preparation required: cardiac ICU, specialist, defibrillator, and emergency room readiness.</p><div className="button-row"><button className="btn-primary compact-btn" onClick={() => resolveIncoming(true)}>Accept simulated patient</button><button className="btn-outline compact-btn" onClick={() => resolveIncoming(false)}>Redirect</button></div></section>}
    </div>

    <section className="card">
      <p className="eyebrow">Shared simulation audit log</p>
      {auditLog.length === 0 ? <p className="muted-copy">Start an Emergency User journey first, then return here to change ICU capacity.</p> : auditLog.map((event) => <div className="audit-item" key={event.id}>
        <span className={`audit-bar audit-${event.tone}`} /><div><strong>{event.text}</strong><small>{event.time} · Simulation</small></div>
      </div>)}
    </section>
    {toast && <div className="toast toast-success" role="status">{toast}</div>}
  </div>
}
