import { Bot, CheckCircle2, Send, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CONDITIONS, type Condition } from '../conditions'

type TriageDrawerProps = {
  open: boolean
  onClose: () => void
  onSelectCondition: (conditionId: string) => void
}

const keywordGroups: Array<{ words: string[]; conditionId: string }> = [
  { words: ['chest', 'heart', 'cardiac'], conditionId: 'cardiac-arrest' },
  { words: ['speech', 'face', 'stroke', 'weakness'], conditionId: 'stroke' },
  { words: ['breath', 'asthma', 'oxygen'], conditionId: 'breathing' },
  { words: ['bleed', 'blood', 'wound'], conditionId: 'bleeding' },
  { words: ['fall', 'accident', 'trauma'], conditionId: 'severe-trauma' },
  { words: ['burn'], conditionId: 'burns' },
]

function matchCondition(text: string): Condition {
  const normalized = text.toLowerCase()
  const matched = keywordGroups.find(({ words }) => words.some((word) => normalized.includes(word)))
  return CONDITIONS.find((condition) => condition.id === matched?.conditionId) ?? CONDITIONS[0]
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
      setMatched(matchCondition(description))
      setIsAnalyzing(false)
    }, 520)
  }

  const useMatch = () => {
    if (!matched) return
    onSelectCondition(matched.id)
    onClose()
  }

  return <aside className={`triage-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Simulated symptom matcher">
    <div className="triage-drawer-header">
      <div><span className="drawer-label"><Sparkles size={13} /> PULSEGRID assist</span><h2>Describe symptoms</h2></div>
      <button className="drawer-close" onClick={onClose} aria-label="Close simulated symptom matcher"><X size={18} /></button>
    </div>
    <div className="triage-drawer-body">
      <div className="assist-intro"><Bot size={18} /><p>This local demo matcher helps preselect a fictional condition. It is not a diagnosis or medical advice.</p></div>
      <label htmlFor="symptom-description">Simulation input</label>
      <textarea id="symptom-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Example: chest discomfort and difficulty breathing" rows={5} />
      <button className="btn-primary triage-submit" onClick={analyze} disabled={!description.trim() || isAnalyzing}>{isAnalyzing ? 'Matching simulated scenario…' : <><Send size={15} /> Analyze simulated scenario</>}</button>

      {matched && <div className="triage-result">
        <span className={`triage-severity severity-${matched.severity}`}>{matched.severity} simulation</span>
        <h3>{matched.name}</h3>
        <p>Capability checklist used by the PULSEGRID demo:</p>
        <ul>{requirements.map((item) => <li key={item}><CheckCircle2 size={14} /> {item}</li>)}</ul>
        <button className="btn-primary" onClick={useMatch}>Use this simulated condition</button>
      </div>}
    </div>
    <p className="triage-disclaimer">Simulation only. For a real emergency, contact local emergency services.</p>
  </aside>
}
