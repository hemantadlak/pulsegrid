import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BedDouble,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DoorOpen,
  HeartPulse,
  Info,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Stethoscope,
  Truck,
  UserCheck,
  Wind,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context'
import { CONDITIONS, type Condition } from '../conditions'

type BoardCase = {
  id: string
  condition: string
  severity: Condition['severity']
  unit: string
  origin: string
  eta: number
  bed?: string
  treatmentStartedAt?: number
}

type AlertKind = 'critical' | 'high' | 'info' | 'success'
type CoordinatorAlert = { id: string; kind: AlertKind; title: string; detail: string; time: string; read: boolean }
type ColumnId = 'incoming' | 'accepted' | 'treating' | 'done'

const DEMO_ALERTS: CoordinatorAlert[] = [
  { id: 'alert-critical', kind: 'critical', title: 'Cardiac emergency incoming — ETA 7 min', detail: 'AMB-SIM-07 · fictional dispatch unit · simulated Sector 22 route', time: '1 min ago', read: false },
  { id: 'alert-high', kind: 'high', title: 'ICU capacity at 40% — 4 of 10 beds occupied', detail: 'Fictional readiness signal: consider assigning simulation staff to floor 2.', time: '5 min ago', read: false },
  { id: 'alert-info', kind: 'info', title: 'Trauma care case accepted by coordinator', detail: 'AMB-SIM-03 assigned a fictional bed in the simulation.', time: '12 min ago', read: false },
  { id: 'alert-success', kind: 'success', title: 'Stroke case status updated to stable', detail: 'Simulation workflow marked the fictional recovery progress as complete.', time: '28 min ago', read: true },
]

const AVAILABLE_BEDS = [
  { id: '3A', floor: 'Floor 2 · Room 301', facilities: ['Cardiac Monitor', 'O₂ Supply'] },
  { id: '6B', floor: 'Floor 3 · Room 608', facilities: ['Ventilator', 'Cardiac Monitor'] },
  { id: '2C', floor: 'Floor 1 · Room 204', facilities: ['O₂ Supply', 'Crash Cart Nearby'] },
  { id: '7A', floor: 'Floor 3 · Room 712', facilities: ['Cardiac Monitor', 'Defibrillator'] },
  { id: '1B', floor: 'Floor 1 · Room 108', facilities: ['General ICU', 'O₂ Supply'] },
  { id: '4D', floor: 'Floor 2 · Room 415', facilities: ['Ventilator', 'Cardiac Monitor', 'O₂'] },
]

const initialIncoming: BoardCase[] = [
  { id: 'showcase-cardiac', condition: 'Cardiac care', severity: 'critical', unit: 'AMB-SIM-07', origin: 'Fictional dispatch unit', eta: 7 },
]

const initialTreating: BoardCase[] = [
  { id: 'showcase-treating', condition: 'Stroke care', severity: 'high', unit: 'AMB-SIM-03', origin: 'Fictional dispatch unit', eta: 0, bed: 'Bed 6B', treatmentStartedAt: Date.now() - 20_000 },
]

const initialDone: BoardCase[] = [
  { id: 'showcase-done', condition: 'Respiratory support', severity: 'medium', unit: 'AMB-SIM-01', origin: 'Fictional dispatch unit', eta: 0, bed: 'Bed 2C' },
]

function caseFromCondition(condition: Condition, eta: number): BoardCase {
  return {
    id: `journey-${condition.id}`,
    condition: condition.name,
    severity: condition.severity,
    unit: 'AMB-SIM-07',
    origin: 'Fictional dispatch unit',
    eta,
  }
}

function SeverityIcon({ severity }: { severity: Condition['severity'] }) {
  const props = { size: 16, strokeWidth: 2.3 }
  if (severity === 'critical') return <HeartPulse {...props} />
  if (severity === 'high') return <AlertTriangle {...props} />
  return <Stethoscope {...props} />
}

function alertIcon(kind: AlertKind) {
  if (kind === 'critical') return <AlertCircle size={16} />
  if (kind === 'high') return <AlertTriangle size={16} />
  if (kind === 'success') return <CheckCircle2 size={16} />
  return <Info size={16} />
}

function formatDuration(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const secs = (totalSeconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export function CoordinatorDashboard() {
  const { hospitals, alerts: sharedAlerts, selectedConditionId, destinationId, journeyState, updateMetroStatus, recordHospitalDecision } = useApp()
  const metro = hospitals.find((hospital) => hospital.id === 'metro')!
  const [icuBeds, setIcuBeds] = useState(metro.icuBeds)
  const [ventilators, setVentilators] = useState(2)
  const [specialistOn, setSpecialistOn] = useState(metro.cardiacSpecialist)
  const [erStatus, setErStatus] = useState(metro.erStatus)
  const [saved, setSaved] = useState(false)
  const [counterKey, setCounterKey] = useState(0)
  const [incomingCards, setIncomingCards] = useState<BoardCase[]>(initialIncoming)
  const [acceptedCards, setAcceptedCards] = useState<BoardCase[]>([])
  const [treatingCards, setTreatingCards] = useState<BoardCase[]>(initialTreating)
  const [doneCards, setDoneCards] = useState<BoardCase[]>(initialDone)
  const [draggedCase, setDraggedCase] = useState<BoardCase | null>(null)
  const [dragTarget, setDragTarget] = useState<ColumnId | null>(null)
  const [alertPanelOpen, setAlertPanelOpen] = useState(false)
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'info'>('all')
  const [coordinatorAlerts, setCoordinatorAlerts] = useState<CoordinatorAlert[]>(DEMO_ALERTS)
  const [unreadCount, setUnreadCount] = useState(3)
  const [bedModalOpen, setBedModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<BoardCase | null>(null)
  const [selectedBed, setSelectedBed] = useState<string | null>(null)
  const [preparedActions, setPreparedActions] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [now, setNow] = useState(Date.now())

  const selectedCondition = CONDITIONS.find((item) => item.id === selectedConditionId) ?? CONDITIONS[0]
  const destination = hospitals.find((hospital) => hospital.id === destinationId)
  const todayCount = 7 + doneCards.length
  const statusConfig = erStatus === 'accepting'
    ? { label: 'Hospital accepting fictional simulation cases', description: 'Coordinator status is accepting. Resource updates sync to open PULSEGRID simulation tabs.', icon: CheckCircle2 }
    : erStatus === 'limited'
      ? { label: 'Hospital at limited capacity — critical cases only', description: 'This fictional capacity setting immediately updates the simulated decision flow.', icon: AlertTriangle }
      : { label: 'Diverting fictional cases — not accepting new admissions', description: 'Emergency users will see a simulated reassessment request.', icon: AlertCircle }
  const StatusIcon = statusConfig.icon
  const treatmentSeconds = (card: BoardCase) => Math.max(0, Math.floor((now - (card.treatmentStartedAt ?? now)) / 1000))
  const visibleAlerts = coordinatorAlerts.filter((alert) => alertFilter === 'all' || (alertFilter === 'critical' ? alert.kind === 'critical' || alert.kind === 'high' : alert.kind === 'info' || alert.kind === 'success'))

  useEffect(() => {
    setIcuBeds(metro.icuBeds)
    setSpecialistOn(metro.cardiacSpecialist)
    setErStatus(metro.erStatus)
  }, [metro])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAiText((previous) => {
        const full = 'Cardiac case incoming. Prepare the fictional cath lab workflow and notify the on-duty simulation team.'
        return previous.length >= full.length ? previous : full.slice(0, previous.length + 1)
      })
    }, 24)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const openPanel = () => { setAlertPanelOpen(true); setUnreadCount(0) }
    window.addEventListener('pulsegrid:open-coordinator-alerts', openPanel)
    return () => window.removeEventListener('pulsegrid:open-coordinator-alerts', openPanel)
  }, [])

  useEffect(() => {
    if (journeyState === 'idle') return
    const nextCase = caseFromCondition(selectedCondition, destination?.etaMinutes ?? 7)
    setIncomingCards((previous) => previous.some((card) => card.id === nextCase.id) ? previous : [nextCase, ...previous])
  }, [journeyState, selectedCondition, destination?.etaMinutes])

  useEffect(() => {
    const freshAlert = sharedAlerts.find((alert) => alert.audience === 'coordinator' || alert.audience === 'all')
    if (!freshAlert) return
    setCoordinatorAlerts((previous) => previous.some((alert) => alert.id === `shared-${freshAlert.id}`) ? previous : [{ id: `shared-${freshAlert.id}`, kind: freshAlert.tone === 'red' ? 'critical' : freshAlert.tone === 'amber' ? 'high' : freshAlert.tone === 'green' ? 'success' : 'info', title: freshAlert.text, detail: 'Live fictional PULSEGRID simulation update.', time: 'now', read: false }, ...previous])
    setUnreadCount((count) => Math.min(9, count + 1))
  }, [sharedAlerts])

  const bumpCounter = (nextValue: number) => {
    setIcuBeds(nextValue)
    setCounterKey((value) => value + 1)
  }

  const saveStatus = () => {
    updateMetroStatus({ icuBeds, cardiacSpecialist: specialistOn, erStatus })
    setSaved(true)
    toast.success('Fictional hospital status saved')
    window.setTimeout(() => setSaved(false), 2000)
  }

  const openBedSelector = (card: BoardCase) => {
    if (icuBeds <= 0) {
      toast.error('No fictional ICU beds are currently available')
      return
    }
    setSelectedPatient(card)
    setSelectedBed(null)
    setBedModalOpen(true)
  }

  const removeFromAllColumns = (id: string) => {
    setIncomingCards((cards) => cards.filter((card) => card.id !== id))
    setAcceptedCards((cards) => cards.filter((card) => card.id !== id))
    setTreatingCards((cards) => cards.filter((card) => card.id !== id))
    setDoneCards((cards) => cards.filter((card) => card.id !== id))
  }

  const confirmBedAssignment = () => {
    if (!selectedPatient || !selectedBed) return
    const accepted = { ...selectedPatient, bed: `Bed ${selectedBed}` }
    removeFromAllColumns(selectedPatient.id)
    setAcceptedCards((cards) => [accepted, ...cards])
    const nextIcu = Math.max(0, icuBeds - 1)
    bumpCounter(nextIcu)
    updateMetroStatus({ icuBeds: nextIcu, cardiacSpecialist: specialistOn, erStatus })
    recordHospitalDecision(true)
    setBedModalOpen(false)
    setSelectedPatient(null)
    setSelectedBed(null)
    toast.success(`Fictional case accepted · Bed ${selectedBed} assigned`)
  }

  const redirectCase = (card: BoardCase) => {
    removeFromAllColumns(card.id)
    recordHospitalDecision(false, 'Coordinator redirected the fictional case')
    toast.success('Fictional patient rerouted')
  }

  const moveToColumn = (card: BoardCase, target: ColumnId) => {
    if (target === 'incoming') return
    if (target === 'accepted') { openBedSelector(card); return }
    removeFromAllColumns(card.id)
    if (target === 'treating') setTreatingCards((cards) => [{ ...card, treatmentStartedAt: Date.now() }, ...cards])
    if (target === 'done') setDoneCards((cards) => [{ ...card }, ...cards])
    toast.success(`Fictional case moved to ${target}`)
  }

  const dropCase = (target: ColumnId) => {
    if (!draggedCase) return
    moveToColumn(draggedCase, target)
    setDraggedCase(null)
    setDragTarget(null)
  }

  const markAlertRead = (id: string) => setCoordinatorAlerts((items) => items.map((alert) => alert.id === id ? { ...alert, read: true } : alert))
  const markAllRead = () => { setCoordinatorAlerts((items) => items.map((alert) => ({ ...alert, read: true }))); setUnreadCount(0); window.dispatchEvent(new Event('pulsegrid:coordinator-alerts-read')) }
  const refreshAi = () => { setAiText(''); toast.success('Fictional AI assessment refreshed') }
  const togglePreparedAction = (action: string) => setPreparedActions((items) => items.includes(action) ? items.filter((item) => item !== action) : [...items, action])

  const boardColumns = useMemo(() => [
    { id: 'incoming' as const, label: 'Incoming', cards: incomingCards },
    { id: 'accepted' as const, label: 'Accepted', cards: acceptedCards },
    { id: 'treating' as const, label: 'Treating', cards: treatingCards },
    { id: 'done' as const, label: 'Done', cards: doneCards },
  ], [incomingCards, acceptedCards, treatingCards, doneCards])

  const renderCaseCard = (card: BoardCase, column: ColumnId) => {
    const seconds = treatmentSeconds(card)
    const showMoveToDone = column === 'treating' && seconds >= 5
    return <article
      key={card.id}
      className={`kanban-case severity-${card.severity} ${draggedCase?.id === card.id ? 'is-dragging' : ''}`}
      draggable
      onDragStart={() => setDraggedCase(card)}
      onDragEnd={() => { setDraggedCase(null); setDragTarget(null) }}
    >
      <div className="kanban-case-title"><span className={`case-condition-icon severity-${card.severity}`}><SeverityIcon severity={card.severity} /></span><strong>{card.condition}</strong><span className={`case-severity severity-${card.severity}`}>{card.severity}</span></div>
      <p className="case-meta"><Truck size={13} />{card.unit} · fictional crew</p>
      {column === 'incoming' && <p className="case-eta"><Clock3 size={13} />ETA: {card.eta} min</p>}
      {column === 'accepted' && <><div className="ready-line"><span><CheckCircle2 size={14} />Ready</span><span><Check size={14} />Prep complete</span></div><div className="treatment-progress"><span>Preparation in {Math.max(1, card.eta - 2)} min</span><i style={{ width: '56%' }} /></div></>}
      {column === 'treating' && <><p className="treatment-clock"><Clock3 size={13} />In treatment {formatDuration(seconds)}</p><div className="treatment-progress amber"><i style={{ width: `${Math.min(100, Math.max(8, seconds * 1.66))}%` }} /></div>{showMoveToDone && <button className="move-done-btn" onClick={() => moveToColumn(card, 'done')}>Move to Done <ChevronRight size={14} /></button>}</>}
      {column === 'done' && <p className="done-line"><CheckCircle2 size={14} />Fictional workflow complete</p>}
      {column === 'incoming' && <div className="case-actions"><button className="case-accept" onClick={() => openBedSelector(card)}>Accept & assign bed</button><button className="case-redirect" onClick={() => redirectCase(card)}>Redirect</button></div>}
    </article>
  }

  return <div className="coordinator-board">
    <header className="coordinator-page-heading">
      <div><p className="eyebrow">Hospital coordinator · fictional operations view</p><h1>Metro Care Centre</h1><p>Manage simulated capacity, case preparation, and alerts in one place.</p></div>
      <div className="coordinator-heading-meta"><span className="coordinator-live-dot" />Live simulation sync</div>
    </header>

    <section className={`coordinator-status-banner status-${erStatus}`} aria-live="polite"><StatusIcon size={21} /><div><strong>{statusConfig.label}</strong><span>{statusConfig.description}</span></div></section>

    <section className="coordinator-stat-grid" aria-label="Hospital statistics">
      <StatCard label="ICU Beds" value={icuBeds} sublabel="of 10 total" tone="green" icon={<BedDouble size={22} />} progress={`${Math.min(100, icuBeds * 10)}%`} />
      <StatCard label="Vents" value={ventilators} sublabel="of 8 total" tone="blue" icon={<Wind size={22} />} progress={`${Math.min(100, ventilators * 12.5)}%`} />
      <StatCard label="Incoming" value={incomingCards.length} tone="red" icon={<AlertCircle size={22} />} progress={incomingCards.length ? '78%' : '0%'} pulse={incomingCards.length > 0} />
      <StatCard label="Today" value={todayCount} tone="amber" icon={<Calendar size={22} />} progress={`${Math.min(100, todayCount * 5)}%`} />
    </section>

    <section id="coordinator-kanban" className="coordinator-kanban" aria-label="Fictional patient workflow board">
      {boardColumns.map((column) => <section
        className={`kanban-column column-${column.id} ${dragTarget === column.id ? 'drop-active' : ''}`}
        key={column.id}
        onDragOver={(event) => { event.preventDefault(); setDragTarget(column.id) }}
        onDragLeave={() => setDragTarget(null)}
        onDrop={(event) => { event.preventDefault(); dropCase(column.id) }}
      >
        <header className="kanban-header"><span>{column.label}</span><b>{column.cards.length}</b></header>
        <div className="kanban-column-body">{column.cards.length ? column.cards.map((card) => renderCaseCard(card, column.id)) : <p className="kanban-empty">No fictional cases in this stage.</p>}</div>
      </section>)}
    </section>

    <section className="coordinator-bottom-grid">
      <section id="capacity" className="coordinator-control-card">
        <div className="control-card-heading"><div><h2>System Controls</h2><p>Quick adjustments</p></div><Stethoscope size={19} /></div>
        <div className="system-control-row"><div className="system-control-label"><span className="icon-container icon-sm icon-green"><UserCheck size={16} /></span><div><strong>Specialist On-Duty</strong><small>Fictional cardiology coordinator</small></div></div><label className="toggle-switch toggle-switch-large"><input type="checkbox" checked={specialistOn} onChange={(event) => setSpecialistOn(event.target.checked)} /><span className="toggle-slider" /></label></div>
        <div className="system-control-row icu-control"><div className="system-control-label"><span className="icon-container icon-sm icon-blue"><BedDouble size={16} /></span><div><strong>ICU Beds Available</strong><small>Fictional capacity only</small></div></div><div className="counter-wrap coordinator-counter"><button className="counter-btn" onClick={() => bumpCounter(Math.max(0, icuBeds - 1))} aria-label="Decrease ICU beds"><Minus size={17} /></button><strong className="counter-value" key={counterKey}>{icuBeds}</strong><button className="counter-btn counter-plus" onClick={() => bumpCounter(Math.min(10, icuBeds + 1))} aria-label="Increase ICU beds"><Plus size={17} /></button></div></div>
        <div className="er-control"><div className="system-control-label"><span className="icon-container icon-sm icon-amber"><DoorOpen size={16} /></span><strong>ER Status</strong></div><div className="seg-control">{(['accepting', 'limited', 'diverting'] as const).map((status) => <button key={status} className={`seg-btn ${erStatus === status ? 'active' : ''}`} onClick={() => setErStatus(status)}>{status}</button>)}</div></div>
        <button id="update-status-btn" className={`save-status-btn ${saved ? 'saved' : ''}`} onClick={saveStatus}>{saved ? <><Check size={17} />Saved</> : <><Save size={17} />Update Status</>}</button>
        <p className="saved-time">{saved ? 'Saved just now' : 'Changes remain local until saved'}</p>
      </section>

      <section className="coordinator-ai-card">
        <div className="ai-card-heading"><h2>✦ AI Triage Assessment</h2><span>+ AI Assessment</span></div>
        <p className="ai-typewriter">{aiText}<i /></p>
        <div className="ai-action-chips">{['Prepare Cath Lab', 'Alert simulation team', 'Ready Defibrillator'].map((action, index) => <button key={action} className={`ai-chip chip-${index} ${preparedActions.includes(action) ? 'complete' : ''}`} onClick={() => togglePreparedAction(action)}>{preparedActions.includes(action) && <CheckCircle2 size={13} />}{action}</button>)}</div>
        <button className="refresh-ai" onClick={refreshAi}><RefreshCw size={13} />Refresh AI</button>
        <p className="ai-disclaimer">Rule-based fictional preparedness suggestions only — not clinical guidance.</p>
      </section>
    </section>

    {alertPanelOpen && <><button className="alert-backdrop" aria-label="Close alerts" onClick={() => setAlertPanelOpen(false)} /><aside className="coordinator-alert-panel" aria-label="Alerts and notifications"><div className="alert-panel-heading"><div><h2>Alerts &amp; Notifications</h2><button onClick={markAllRead}>Mark all read</button></div><button className="alert-panel-close" onClick={() => setAlertPanelOpen(false)} aria-label="Close alerts"><X size={18} /></button></div><div className="alert-tabs">{(['all', 'critical', 'info'] as const).map((tab) => <button key={tab} className={alertFilter === tab ? 'active' : ''} onClick={() => setAlertFilter(tab)}>{tab === 'all' ? 'All' : tab === 'critical' ? 'Critical' : 'Info'}</button>)}</div><div className="alert-list">{visibleAlerts.map((alert) => <article key={alert.id} className={`alert-panel-item alert-${alert.kind} ${alert.read ? 'is-read' : ''}`} onClick={() => markAlertRead(alert.id)}><div className="alert-item-top"><span>{alertIcon(alert.kind)}</span><strong>{alert.title}</strong><time>{alert.time}</time></div><p>{alert.detail}</p><div className="alert-item-actions"><button onClick={(event) => { event.stopPropagation(); markAlertRead(alert.id) }}>Acknowledge</button><button onClick={(event) => { event.stopPropagation(); document.getElementById('coordinator-kanban')?.scrollIntoView({ behavior: 'smooth' }); setAlertPanelOpen(false) }}>View case</button></div></article>)}</div></aside></>}

    {bedModalOpen && selectedPatient && <div className="bed-modal-backdrop" role="presentation" onMouseDown={() => setBedModalOpen(false)}><section className="bed-selector-modal" role="dialog" aria-modal="true" aria-labelledby="bed-selector-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setBedModalOpen(false)} aria-label="Close bed selector"><X size={18} /></button><h2 id="bed-selector-title">Assign a Bed</h2><p className="bed-modal-subtitle">Select an available fictional bed for {selectedPatient.condition} — {selectedPatient.unit}</p><div className="bed-patient-summary"><div><span className={`case-condition-icon severity-${selectedPatient.severity}`}><SeverityIcon severity={selectedPatient.severity} /></span><strong>{selectedPatient.condition}</strong><span className={`case-severity severity-${selectedPatient.severity}`}>{selectedPatient.severity}</span></div><p>{selectedPatient.unit} · fictional crew · ETA: {selectedPatient.eta} min</p></div><p className="bed-grid-label">Available ICU Beds</p><div className="bed-grid">{AVAILABLE_BEDS.map((bed) => <button key={bed.id} className={`bed-option ${selectedBed === bed.id ? 'selected' : ''}`} onClick={() => setSelectedBed(bed.id)}><span><BedDouble size={20} /><strong>Bed {bed.id}</strong></span><small>{bed.floor}</small><em>Available</em><div>{bed.facilities.map((facility) => <i key={facility}>{facility}</i>)}</div></button>)}</div><div className="bed-modal-actions"><button className="btn-outline" onClick={() => setBedModalOpen(false)}>Cancel</button><button className="btn-primary" disabled={!selectedBed} onClick={confirmBedAssignment}>Confirm — Assign {selectedBed ? `Bed ${selectedBed}` : 'bed'}</button></div></section></div>}

    <span className="sr-only">{unreadCount} unread fictional coordinator alerts</span>
  </div>
}

function StatCard({ label, value, sublabel, tone, icon, progress, pulse = false }: { label: string; value: number; sublabel?: string; tone: 'green' | 'blue' | 'red' | 'amber'; icon: ReactNode; progress: string; pulse?: boolean }) {
  return <article className={`coordinator-stat-card stat-${tone}`}><div className="stat-card-top"><div><strong className={`stat-card-value ${pulse ? 'pulse-number' : ''}`}>{value}</strong><p>{label}</p>{sublabel && <small>{sublabel}</small>}</div><span className="stat-icon-wrap">{icon}</span></div><div className="stat-progress"><i style={{ width: progress }} /></div></article>
}
