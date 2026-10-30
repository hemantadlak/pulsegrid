import { Building2, HeartPulse, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CONDITIONS } from '../../conditions'
import { useApp } from '../../context'

export function GlobalSearch() {
  const { hospitals, setSelectedConditionId } = useApp()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true) }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const conditions = useMemo(() => CONDITIONS.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4), [query])
  const matchingHospitals = useMemo(() => hospitals.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3), [hospitals, query])
  return <><button className="nav-search" aria-label="Search hospitals and conditions" onClick={() => setOpen(true)}><Search size={18} /><span>Search</span><kbd>⌘K</kbd></button>
    {open && <div className="modal-backdrop search-backdrop" onMouseDown={() => setOpen(false)}>
      <section className="global-search" role="dialog" aria-modal="true" aria-label="Search hospitals and conditions" onMouseDown={(event) => event.stopPropagation()}>
        <div className="search-input-wrap"><Search size={18} /><input autoFocus placeholder="Search hospitals, conditions…" value={query} onChange={(event) => setQuery(event.target.value)} /><button aria-label="Close search" onClick={() => setOpen(false)}><X size={18} /></button></div>
        <div className="search-group"><p>Conditions</p>{conditions.map((condition) => <button key={condition.id} className="search-result" onClick={() => { setSelectedConditionId(condition.id); setOpen(false); window.setTimeout(() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' }), 0) }}><HeartPulse size={17} /><span>{condition.name}<small>{condition.severity}</small></span></button>)}</div>
        <div className="search-group"><p>Hospitals</p>{matchingHospitals.map((hospital) => <button key={hospital.id} className="search-result" onClick={() => { setOpen(false); window.setTimeout(() => document.getElementById('hospitals')?.scrollIntoView({ behavior: 'smooth' }), 0) }}><Building2 size={17} /><span>{hospital.name}<small>{hospital.etaMinutes} min estimated route</small></span></button>)}</div>
      </section>
    </div>}
  </>
}
