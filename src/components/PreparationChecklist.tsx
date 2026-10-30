import { Check, ClipboardCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CONDITIONS } from '../conditions'
import { useApp } from '../context'

export function PreparationChecklist() {
  const { selectedConditionId } = useApp()
  const condition = CONDITIONS.find((item) => item.id === selectedConditionId) ?? CONDITIONS[0]
  const items = useMemo(() => [
    `Review simulated ${condition.name.toLowerCase()} capability needs`,
    'Confirm fictional receiving-area readiness',
    'Review the simulated handoff summary',
  ], [condition.name])
  const [completed, setCompleted] = useState<string[]>([])

  const toggle = (item: string) => setCompleted((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])

  return <section className="preparation-checklist">
    <div className="prep-heading"><div><span><Sparkles size={13} /> SIMULATION PREPARATION GUIDE</span><h3>{condition.name} scenario</h3></div><ClipboardCheck size={20} /></div>
    <p>Local simulation checklist — not clinical instructions.</p>
    <div className="prep-items">{items.map((item) => <button key={item} className={completed.includes(item) ? 'complete' : ''} onClick={() => toggle(item)}><span>{completed.includes(item) && <Check size={13} />}</span>{item}</button>)}</div>
    <div className="prep-concern">Human coordinator approval is required before every simulated status change.</div>
  </section>
}
