import { Activity, Bot, Play, ShieldCheck, Waypoints } from 'lucide-react'
import { useApp } from '../context'

type SimulationCommandDeckProps = {
  onOpenAssist: () => void
}

const journeyLabel = {
  idle: 'Scenario ready',
  'en-route': 'Simulated journey active',
  'reroute-required': 'Approval required',
  rerouted: 'Destination updated',
} as const

export function SimulationCommandDeck({ onOpenAssist }: SimulationCommandDeckProps) {
  const { assessments, journeyState, startCriticalScenario } = useApp()
  const eligibleHospitals = assessments.filter((hospital) => hospital.eligible).length

  return <section className="simulation-command-deck" aria-label="PULSEGRID simulation command center">
    <div className="command-deck-heading">
      <div>
        <p className="command-kicker"><span /> PULSEGRID simulation command</p>
        <h1>Capability-aware dispatch rehearsal</h1>
        <p>Explore the decision flow with fictional hospitals, fictional units, and a human approval step.</p>
      </div>
      <span className="simulation-status"><ShieldCheck size={15} /> Demo data only</span>
    </div>

    <div className="command-stat-grid">
      <div className="command-stat"><Activity size={17} /><div><small>Scenario status</small><strong>{journeyLabel[journeyState]}</strong></div></div>
      <div className="command-stat"><Waypoints size={17} /><div><small>Eligible hospitals</small><strong>{eligibleHospitals} capability-checked</strong></div></div>
      <div className="command-stat"><ShieldCheck size={17} /><div><small>Decision control</small><strong>Dispatcher confirmation</strong></div></div>
    </div>

    <div className="command-actions">
      <button className="command-primary" onClick={startCriticalScenario}><Play size={16} /> Start cardiac reroute demo</button>
      <button className="command-secondary" onClick={onOpenAssist}><Bot size={16} /> Describe symptoms (demo)</button>
    </div>
  </section>
}
