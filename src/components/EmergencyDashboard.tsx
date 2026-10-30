import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bone, Brain, Droplets, Flame, HeartPulse, Info, Siren, Stethoscope, Wind, type LucideIcon } from 'lucide-react'
import { useApp } from '../context'
import { PulseMap } from './PulseMap'
import { CONDITIONS } from '../conditions'
import { DEMO_BLOOD_SUPPORT } from '../data'
import { useCountdown } from '../hooks/useCountdown'
import { ConfirmModal } from './ui/ConfirmModal'
import { SimulationCommandDeck } from './SimulationCommandDeck'
import { TriageDrawer } from './TriageDrawer'

type AmbulanceChoice = 'yes' | 'no' | null
type Point = [number, number]

const conditionIcons: Record<string, LucideIcon> = {
  'cardiac-arrest': HeartPulse, stroke: Brain, 'severe-trauma': Bone, breathing: Wind,
  burns: Flame, unconscious: Brain, bleeding: Droplets, poisoning: Activity,
  allergic: Activity, fracture: Bone, diabetic: Activity, childbirth: Stethoscope,
}

export function EmergencyDashboard() {
  const { assessments, recommendation, hospitals, selectedConditionId, setSelectedConditionId, journeyState, destinationId, auditLog, dispatch, confirmReroute, keepCurrentDestination, lang, setLang } = useApp()
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)
  const [search, setSearch] = useState('')
  const [ambulanceChoice, setAmbulanceChoice] = useState<AmbulanceChoice>(null)
  const [supportNeed, setSupportNeed] = useState('')
  const [bloodOpen, setBloodOpen] = useState(false)
  const [showAllConditions, setShowAllConditions] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [userLocation, setUserLocation] = useState<Point | undefined>()
  const [locationStatus, setLocationStatus] = useState('')
  const [confirmDispatchOpen, setConfirmDispatchOpen] = useState(false)
  const [triageOpen, setTriageOpen] = useState(false)
  const destination = assessments.find((hospital) => hospital.id === destinationId)
  const selectedCondition = CONDITIONS.find((condition) => condition.id === selectedConditionId)!
  const filteredConditions = useMemo(() => CONDITIONS.filter((condition) => condition.name.toLowerCase().includes(search.toLowerCase())), [search])
  const visibleConditions = search ? filteredConditions : filteredConditions.slice(0, showAllConditions ? CONDITIONS.length : 6)
  const visibleAudit = showFullHistory ? auditLog : auditLog.slice(0, 3)
  const activeJourney = journeyState !== 'idle'
  const countdown = useCountdown(destination?.etaMinutes ?? recommendation?.etaMinutes ?? 10, 0, activeJourney)

  const requestDispatch = () => {
    if (requested || loading || ambulanceChoice !== 'yes') return
    setConfirmDispatchOpen(true)
  }
  const confirmDispatch = () => {
    setConfirmDispatchOpen(false)
    setLoading(true)
    window.setTimeout(() => { setLoading(false); setRequested(true); dispatch() }, 900)
  }
  const chooseCondition = (id: string) => { setSelectedConditionId(id); setAmbulanceChoice(null); setRequested(false); setSupportNeed('') }
  const chooseAmbulance = () => {
    setAmbulanceChoice('yes')
    setLocationStatus('Requesting browser location…')
    if (!navigator.geolocation) { setLocationStatus('Location is unavailable in this browser. Using a demo point.'); return }
    navigator.geolocation.getCurrentPosition(
      (position) => { setUserLocation([position.coords.latitude, position.coords.longitude]); setLocationStatus('Location shared for this browser session.') },
      () => setLocationStatus('Location was not shared. Using a demo point.'),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 60000 },
    )
  }
  useEffect(() => {
    sessionStorage.setItem('pg_flow', JSON.stringify({ selectedConditionId, ambulanceChoice, requested, destinationId, journeyState }))
  }, [selectedConditionId, ambulanceChoice, requested, destinationId, journeyState])

  return <div className="grid-58-42">
    <div className="stack">
      <SimulationCommandDeck onOpenAssist={() => setTriageOpen(true)} />
      <section className="card">
        <p className="eyebrow">Step 1 · simulated emergency triage</p>
        <h1>What is the medical concern?</h1>
        <p className="muted-copy">Choose a simulated condition. PULSEGRID checks capability first, then simulated ETA.</p>
        <input className="condition-search" placeholder="Search simulated conditions" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="condition-grid">
          {visibleConditions.map((condition) => { const ConditionIcon = conditionIcons[condition.id] ?? Stethoscope; return <button key={condition.id} className={`condition-card ${condition.id === selectedConditionId ? `severity-${condition.severity}` : ''}`} onClick={() => chooseCondition(condition.id)}>
            <ConditionIcon size={17} /><span>{condition.name}</span><small>{condition.severity}</small>
          </button> })}
        </div>
        {!search && filteredConditions.length > 6 && <button className="show-more-btn" onClick={() => setShowAllConditions((show) => !show)}>{showAllConditions ? 'Show fewer conditions' : `Show ${filteredConditions.length - 6} more conditions`}</button>}

        <div className="choice-panel">
          <div><strong>Do you need a simulated ambulance?</strong><small>For this prototype only — no real ambulance is contacted.</small></div>
          <div className="button-row"><button className={`choice-btn ${ambulanceChoice === 'yes' ? 'selected' : ''}`} onClick={chooseAmbulance}>Yes, assign ambulance</button><button className={`choice-btn ${ambulanceChoice === 'no' ? 'selected' : ''}`} onClick={() => setAmbulanceChoice('no')}>No, show support options</button></div>{locationStatus && ambulanceChoice === 'yes' && <p className="location-status">{locationStatus}</p>}
        </div>

        {ambulanceChoice === 'yes' && <>
          <div className="ambulance-summary"><Siren size={18} /><div><strong>Nearest suitable simulated ambulance</strong><small>Unit P-14 · paramedic, oxygen, monitoring, and condition-matched capability kit</small></div></div>
          <button id="dispatch-btn" className="btn-danger" onClick={requestDispatch} disabled={loading || requested}>
            {loading ? 'Assigning simulated ambulance…' : requested ? 'Simulated journey started' : 'Assign simulated ambulance'}
          </button>
        </>}

        {ambulanceChoice === 'no' && <div className="support-panel"><strong>What support do you need?</strong><div className="button-row"><button className={`btn-outline compact-btn ${supportNeed === 'hospital' ? 'active-option' : ''}`} onClick={() => setSupportNeed('hospital')}>Nearby capable hospitals</button><button className={`btn-outline compact-btn ${supportNeed === 'guidance' ? 'active-option' : ''}`} onClick={() => setSupportNeed('guidance')}>Care resource guide</button></div>{supportNeed && <p className="muted-copy">{supportNeed === 'hospital' ? 'The eligible-hospital list on the right is ranked by capability and simulated ETA.' : 'This demo can show informational resources only; it does not provide medical advice or contact services.'}</p>}</div>}

        <div className="blood-question"><div><strong>Need blood or plasma support?</strong><small>Fictional demo inventory only.</small></div><button className="btn-outline" onClick={() => setBloodOpen((open) => !open)}>{bloodOpen ? 'Hide list' : 'Yes — view demo list'}</button></div>
        {bloodOpen && <div className="blood-list">{DEMO_BLOOD_SUPPORT.map((item) => <div className="blood-row" key={item.hospital}><div><strong>{item.hospital}</strong><small>{item.eta} min simulated ETA · Blood: {item.blood.join(', ') || 'None'} · Plasma: {item.plasma.join(', ') || 'None'}</small></div><span>{item.price}</span></div>)}<p>Availability and prices are fictional, illustrative values — never for real use.</p></div>}
      </section>

      {journeyState === 'reroute-required' && recommendation && <section className="reroute-alert" role="alert"><div className="alert-heading"><AlertTriangle size={20} /> Destination reassessment required</div><p>Metro Care Centre no longer meets the simulated ICU requirement. {recommendation.name} is now the next eligible destination.</p><div className="button-row"><button className="btn-primary compact-btn" onClick={confirmReroute}>Confirm updated destination</button><button className="btn-outline compact-btn" onClick={keepCurrentDestination}>Keep current destination</button></div></section>}
      <section id="dispatch" className="card map-card"><div className="map-caption"><span className="status-dot" /> Live route view · destination: {destination?.name ?? 'Awaiting dispatch'}</div>{activeJourney && <div className="countdown-card"><span>AMBULANCE ETA</span><strong>{countdown}</strong><small>active route</small></div>}<PulseMap hospitals={hospitals} recommendedId={destinationId} userLocation={userLocation} journeyActive={activeJourney} /></section>
    </div>

    <div className="stack">
      <section id="dashboard" className="card"><p className="eyebrow">Best eligible hospital · {selectedCondition.name}</p><h2>{recommendation?.name ?? 'Select an option to compare'}</h2>{recommendation ? <><p className="muted-copy">{recommendation.reason}</p><div className="requirement-row">{selectedCondition.requiredFacilities.map((facility) => <span className="requirement-chip" key={facility}>{facility}</span>)}</div></> : <p className="muted-copy">Choose a condition to calculate eligible fictional hospitals.</p>}</section>
      <section id="hospitals" className="card"><p className="eyebrow">Hospital eligibility</p><div className="hospital-list">{assessments.map((hospital) => <div className={`hospital-row ${hospital.eligible ? 'eligible-row' : ''} ${hospital.id === destinationId ? 'selected' : ''}`} key={hospital.id}><div><strong>{hospital.name}</strong><small>{hospital.etaMinutes} min estimated route</small></div><div className="hospital-reason"><span className={`badge ${hospital.eligible ? 'badge-green' : 'badge-red'}`}>{hospital.eligible ? 'Eligible' : 'Rejected'}</span><small>{hospital.reason}</small></div></div>)}</div></section>
      <section id="alerts" className="card"><p className="eyebrow">Activity log</p>{auditLog.length === 0 ? <p className="muted-copy">Actions will appear here during the demo.</p> : <>{visibleAudit.map((event) => <div className="audit-item" key={event.id}><span className={`audit-bar audit-${event.tone}`} /><div><strong>{event.text}</strong><small>{event.time} · Demo mode</small></div></div>)}{auditLog.length > 3 && <button className="show-more-btn history-btn" onClick={() => setShowFullHistory((show) => !show)}>{showFullHistory ? 'Show recent activity' : `Show full history (${auditLog.length})`}</button>}</>}<div className="simulation-note"><Info size={14} /> Demo mode only. It cannot call emergency services or access real hospital, blood, or price information.</div></section>
      <section id="settings-panel" className="card"><p className="eyebrow">Display settings</p><p className="muted-copy">Choose your preferred interface language.</p><div className="button-row"><button className={`btn-outline compact-btn ${lang === 'en' ? 'active-option' : ''}`} onClick={() => setLang('en')}>English</button><button className={`btn-outline compact-btn ${lang === 'hi' ? 'active-option' : ''}`} onClick={() => setLang('hi')}>हिंदी</button></div></section>
    </div>
    <TriageDrawer open={triageOpen} onClose={() => setTriageOpen(false)} onSelectCondition={chooseCondition} />
    {confirmDispatchOpen && <ConfirmModal variant="ambulance" onClose={() => setConfirmDispatchOpen(false)} onConfirm={confirmDispatch} />}
  </div>
}
