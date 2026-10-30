import { useMemo, useState } from 'react'
import { AlertTriangle, HeartPulse, Info } from 'lucide-react'
import { useApp } from '../context'
import { PulseMap } from './PulseMap'
import { CONDITIONS } from '../conditions'

export function EmergencyDashboard() {
  const { assessments, recommendation, hospitals, selectedConditionId, setSelectedConditionId, journeyState, destinationId, auditLog, dispatch, confirmReroute, keepCurrentDestination } = useApp()
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)
  const [search, setSearch] = useState('')
  const destination = assessments.find((hospital) => hospital.id === destinationId)
  const selectedCondition = CONDITIONS.find((condition) => condition.id === selectedConditionId)!
  const filteredConditions = useMemo(() => CONDITIONS.filter((condition) => condition.name.toLowerCase().includes(search.toLowerCase())), [search])

  const requestDispatch = () => {
    if (requested || loading) return
    setLoading(true)
    window.setTimeout(() => { setLoading(false); setRequested(true); dispatch() }, 1100)
  }

  return (
    <div className="grid-58-42">
      <div className="stack">
        <section className="card">
          <p className="eyebrow">Step 1 · simulated emergency triage</p>
          <h1>What is the medical concern?</h1>
          <p className="muted-copy">Select a simulated condition. PULSEGRID will show only hospitals with the required capabilities.</p>
          <input className="condition-search" placeholder="Search simulated conditions" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="condition-grid">
            {filteredConditions.map((condition) => <button key={condition.id} className={`condition-card ${condition.id === selectedConditionId ? `severity-${condition.severity}` : ''}`} onClick={() => setSelectedConditionId(condition.id)}>
              <HeartPulse size={17} /><span>{condition.name}</span><small>{condition.severity}</small>
            </button>)}
          </div>
          <button id="dispatch-btn" className="btn-danger" onClick={requestDispatch} disabled={loading || requested}>
            {loading ? 'Contacting simulated dispatch…' : requested ? 'Simulated journey started' : 'Request simulated assistance'}
          </button>
        </section>

        {journeyState === 'reroute-required' && recommendation && (
          <section className="reroute-alert" role="alert">
            <div className="alert-heading"><AlertTriangle size={20} /> Destination reassessment required</div>
            <p>Metro Care Centre no longer meets the simulated ICU requirement. {recommendation.name} is now the next eligible destination.</p>
            <div className="button-row">
              <button className="btn-primary compact-btn" onClick={confirmReroute}>Confirm updated destination</button>
              <button className="btn-outline compact-btn" onClick={keepCurrentDestination}>Keep current destination</button>
            </div>
          </section>
        )}

        <section className="card map-card">
          <div className="map-caption"><span className="status-dot" /> OpenStreetMap demo view · destination: {destination?.name ?? 'Awaiting dispatch'}</div>
          <PulseMap hospitals={hospitals} recommendedId={destinationId} />
        </section>
      </div>

      <div className="stack">
        <section className="card">
          <p className="eyebrow">Best eligible hospital · {selectedCondition.name}</p>
          <h2>{recommendation?.name ?? 'Awaiting simulated request'}</h2>
          {recommendation ? <>
            <div className="metric-row"><strong>{recommendation.etaMinutes} min</strong><span>simulated ETA</span></div>
            <p className="muted-copy">{recommendation.reason}</p><div className="requirement-row">{selectedCondition.requiredFacilities.map((facility) => <span className="requirement-chip" key={facility}>{facility}</span>)}</div>
          </> : <p className="muted-copy">Submit the simulated request to calculate an eligible destination.</p>}
        </section>

        <section className="card">
          <p className="eyebrow">Hospital eligibility</p>
          <div className="hospital-list">
            {assessments.map((hospital) => <div className={`hospital-row ${hospital.id === destinationId ? 'selected' : ''}`} key={hospital.id}>
              <div><strong>{hospital.name}</strong><small>{hospital.etaMinutes} min simulated ETA</small></div>
              <div className="hospital-reason"><span className={`badge ${hospital.eligible ? 'badge-green' : 'badge-red'}`}>{hospital.eligible ? 'Eligible' : 'Rejected'}</span><small>{hospital.reason}</small></div>
            </div>)}
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Simulation audit log</p>
          {auditLog.length === 0 ? <p className="muted-copy">Actions will appear here during the demo.</p> : auditLog.slice(0, 6).map((event) => <div className="audit-item" key={event.id}>
            <span className={`audit-bar audit-${event.tone}`} /><div><strong>{event.text}</strong><small>{event.time} · Simulation</small></div>
          </div>)}
          <div className="simulation-note"><Info size={14} /> No real emergency calls, ambulances, patient data, or hospital availability are used.</div>
        </section>
      </div>
    </div>
  )
}
