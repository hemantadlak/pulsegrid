import { Bot, CheckCircle2, Send, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Condition } from '../conditions'
import { matchSimulatedCondition } from '../lib/simulatedTriage'

type TriageDrawerProps = {
  open: boolean
  onClose: () => void
  onSelectCondition: (conditionId: string) => void
}

export function TriageDrawer({ open, onClose, onSelectCondition }: TriageDrawerProps) {
  const [description, setDescription] = useState('')
  const [matched, setMatched] = useState<Condition | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const requirements = useMemo(() => matched?.requiredFacilities.slice(0, 4) ?? [], [matched])

  const analyze = () => {
    if (!description.trim() || isAnalyzing) return
    setIsAnalyzing(true)
    window.setTimeout(() => {
      setMatched(matchSimulatedCondition(description))
      setIsAnalyzing(false)
    }, 520)
  }

  const useMatch = () => {
    if (!matched) return
    onSelectCondition(matched.id)
    onClose()
  }

  return <aside className={`triage-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="AI triage assistant">
    <div className="triage-drawer-header">
      <div><span className="drawer-label"><Sparkles size={13} /> PULSEGRID AI triage</span><h2>Describe the situation</h2></div>
      <button className="drawer-close" onClick={onClose} aria-label="Close AI triage assistant"><X size={18} /></button>
    </div>
    <div className="triage-drawer-body">
      <div className="assist-intro"><Bot size={18} /><p>This local, rule-based assistant preselects a fictional condition from the words you provide. It is not a diagnosis or medical advice.</p></div>
      <label htmlFor="symptom-description">Describe the situation</label>
      <textarea id="symptom-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Example: chest discomfort and difficulty breathing" rows={5} />
      <button className="btn-primary triage-submit" onClick={analyze} disabled={!description.trim() || isAnalyzing}>{isAnalyzing ? 'Matching…' : <><Send size={15} /> Analyze input</>}</button>

      {matched && <div className="triage-result">
        <span className={`triage-severity severity-${matched.severity}`}>{matched.severity} priority</span>
        <h3>{matched.name}</h3>
        <p>Fictional capability checklist used by PULSEGRID:</p>
        <ul>{requirements.map((item) => <li key={item}><CheckCircle2 size={14} /> {item}</li>)}</ul>
        <button className="btn-primary" onClick={useMatch}>Continue to dispatch</button>
      </div>}
    </div>
    <p className="triage-disclaimer">Fictional training workspace only. For a real emergency, contact local emergency services.</p>
  </aside>
}
