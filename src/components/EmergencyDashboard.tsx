import { useMemo, useState } from 'react'
import { AlertTriangle, HeartPulse, Info, Siren } from 'lucide-react'
import { useApp } from '../context'
import { PulseMap } from './PulseMap'
import { CONDITIONS } from '../conditions'
import { DEMO_BLOOD_SUPPORT } from '../data'
import { useCountdown } from '../hooks/useCountdown'

type AmbulanceChoice = 'yes' | 'no' | null

export function EmergencyDashboard() {
  const { assessments, recommendation, hospitals, selectedConditionId, setSelectedConditionId, journeyState, destinationId, auditLog, dispatch, confirmReroute, keepCurrentDestination } = useApp()
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)
  const [search, setSearch] = useState('')
  const [ambulanceChoice, setAmbulanceChoice] = useState<AmbulanceChoice>(null)
  const [supportNeed, setSupportNeed] = useState('')
  const [bloodOpen, setBloodOpen] = useState(false)
  const countdown = useCountdown(7, 42, journeyState !== 'idle')
  const destination = assessments.find((hospital) => hospital.id === destinationId)
  const selectedCondition = CONDITIONS.find((condition) => condition.id === selectedConditionId)!
  const filteredConditions = useMemo(() => CONDITIONS.filter((condition) => condition.name.toLowerCase().includes(search.toLowerCase())), [search])
  const isCritical = selectedCondition.severity === 'critical'

  const requestDispatch = () => {
    if (requested || loading || (isCritical && ambulanceChoice !== 'yes')) return
    setLoading(true)
    window.setTimeout(() => { setLoading(false); setRequested(true); dispatch() }, 900)
  }
  const chooseCondition = (id: string) => { setSelectedConditionId(id); setAmbulanceChoice(null); setRequested(false); setSupportNeed('') }

  return <div className="grid-58-42">
    <div className="stack">
      <section className="card">
        <p className="eyebrow">Step 1 · simulated emergency triage</p>
        <h1>What is the medical concern?</h1>
        <p className="muted-copy">Choose a simulated condition. PULSEGRID checks capability first, then simulated ETA.</p>
        <input className="condition-search" placeholder="Search simulated conditions" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="condition-grid">
          {filteredConditions.map((condition) => <button key={condition.id} className={`condition-card ${condition.id === selectedConditionId ? `severity-${condition.severity}` : ''}`} onClick={() => chooseCondition(condition.id)}>
            <HeartPulse size={17} /><span>{condition.name}</span><small>{condition.severity}</small>
          </button>)}
        </div>

        {isCritical && <div className="choice-panel">
          <div><strong>Do you need a simulated ambulance?</strong><small>For this prototype only — no real ambulance is contacted.</small></div>
          <div className="button-row"><button className={`choice-btn ${ambulanceChoice === 'yes' ? 'selected' : ''}`} onClick={() => setAmbulanceChoice('yes')}>Yes, assign ambulance</button><button className={`choice-btn ${ambulanceChoice === 'no' ? 'selected' : ''}`} onClick={() => setAmbulanceChoice('no')}>No, show support options</button></div>
        </div>}

        {(ambulanceChoice === 'yes' || !isCritical) && <>
          <div className="ambulance-summary"><Siren size={18} /><div><strong>Nearest suitable simulated ambulance</strong><small>Unit P-14 · paramedic, oxygen, monitoring, and condition-matched capability kit</small></div></div>
          <button id="dispatch-btn" className="btn-danger" onClick={requestDispatch} disabled={loading || requested || (isCritical && ambulanceChoice !== 'yes')}>
            {loading ? 'Assigning simulated ambulance…' : requested ? 'Simulated journey started' : 'Assign simulated ambulance'}
          </button>
        </>}

        {ambulanceChoice === 'no' && <div className="support-panel"><strong>What support do you need?</strong><div className="button-row"><button className={`btn-outline compact-btn ${supportNeed === 'hospital' ? 'active-option' : ''}`} onClick={() => setSupportNeed('hospital')}>Nearby capable hospitals</button><button className={`btn-outline compact-btn ${supportNeed === 'guidance' ? 'active-option' : ''}`} onClick={() => setSupportNeed('guidance')}>Care resource guide</button></div>{supportNeed && <p className="muted-copy">{supportNeed === 'hospital' ? 'The eligible-hospital list on the right is ranked by capability and simulated ETA.' : 'This demo can show informational resources only; it does not provide medical advice or contact services.'}</p>}</div>}

        <div className="blood-question"><div><strong>Need blood or plasma support?</strong><small>Fictional demo inventory only.</small></div><button className="btn-outline" onClick={() => setBloodOpen((open) => !open)}>{bloodOpen ? 'Hide list' : 'Yes — view demo list'}</button></div>
        {bloodOpen && <div className="blood-list">{DEMO_BLOOD_SUPPORT.map((item) => <div className="blood-row" key={item.hospital}><div><strong>{item.hospital}</strong><small>{item.eta} min simulated ETA · Blood: {item.blood.join(', ') || 'None'} · Plasma: {item.plasma.join(', ') || 'None'}</small></div><span>{item.price}</span></div>)}<p>Availability and prices are fictional, illustrative values — never for real use.</p></div>}
      </section>

      {journeyState === 'reroute-required' && recommendation && <section className="reroute-alert" role="alert"><div className="alert-heading"><AlertTriangle size={20} /> Destination reassessment required</div><p>Metro Care Centre no longer meets the simulated ICU requirement. {recommendation.name} is now the next eligible destination.</p><div className="button-row"><button className="btn-primary compact-btn" onClick={confirmReroute}>Confirm updated destination</button><button className="btn-outline compact-btn" onClick={keepCurrentDestination}>Keep current destination</button></div></section>}
      <section className="card map-card"><div className="map-caption"><span className="status-dot" /> OpenStreetMap demo view · destination: {destination?.name ?? 'Awaiting dispatch'}</div>{journeyState !== 'idle' && <div className="countdown-card"><span>SIMULATED AMBULANCE ETA</span><strong>{countdown}</strong><small>countdown demo</small></div>}<PulseMap hospitals={hospitals} recommendedId={destinationId} /></section>
    </div>

    <div className="stack">
      <section className="card"><p className="eyebrow">Best eligible hospital · {selectedCondition.name}</p><h2>{recommendation?.name ?? 'Select an option to compare'}</h2>{recommendation ? <><div className="metric-row"><strong>{recommendation.etaMinutes} min</strong><span>simulated ETA</span></div><p className="muted-copy">{recommendation.reason}</p><div className="requirement-row">{selectedCondition.requiredFacilities.map((facility) => <span className="requirement-chip" key={facility}>{facility}</span>)}</div></> : <p className="muted-copy">Choose a condition to calculate eligible fictional hospitals.</p>}</section>
      <section className="card"><p className="eyebrow">Hospital eligibility</p><div className="hospital-list">{assessments.map((hospital) => <div className={`hospital-row ${hospital.eligible ? 'eligible-row' : ''} ${hospital.id === destinationId ? 'selected' : ''}`} key={hospital.id}><div><strong>{hospital.name}</strong><small>{hospital.etaMinutes} min simulated ETA</small></div><div className="hospital-reason"><span className={`badge ${hospital.eligible ? 'badge-green' : 'badge-red'}`}>{hospital.eligible ? 'Eligible' : 'Rejected'}</span><small>{hospital.reason}</small></div></div>)}</div></section>
      <section className="card"><p className="eyebrow">Simulation audit log</p>{auditLog.length === 0 ? <p className="muted-copy">Actions will appear here during the demo.</p> : auditLog.slice(0, 7).map((event) => <div className="audit-item" key={event.id}><span className={`audit-bar audit-${event.tone}`} /><div><strong>{event.text}</strong><small>{event.time} · Simulation</small></div></div>)}<div className="simulation-note"><Info size={14} /> No real emergency calls, ambulances, patient data, hospital availability, blood, plasma, or prices are used.</div></section>
    </div>
  </div>
}
