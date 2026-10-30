import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { INITIAL_HOSPITALS, type Hospital } from './data'
import { assessHospitals, recommendHospital, type HospitalAssessment } from './decisionEngine'
import { CONDITIONS } from './conditions'
import type { Lang } from './i18n'

export type Role = 'emergency' | 'coordinator' | null
export type JourneyState = 'idle' | 'en-route' | 'reroute-required' | 'rerouted'
export type AuditEvent = { id: number; text: string; time: string; tone: 'blue' | 'green' | 'amber' | 'red' }

interface AppContextType {
  role: Role; setRole: (role: Role) => void; lang: Lang; setLang: (lang: Lang) => void
  hospitals: Hospital[]; assessments: HospitalAssessment[]; recommendation: HospitalAssessment | null
  selectedConditionId: string; setSelectedConditionId: (id: string) => void
  journeyState: JourneyState; destinationId: string | null; auditLog: AuditEvent[]
  dispatch: (options?: { helper?: boolean }) => void
  updateMetroStatus: (update: Pick<Hospital, 'icuBeds' | 'cardiacSpecialist' | 'erStatus'>) => void
  confirmReroute: () => void; keepCurrentDestination: () => void
  recordHospitalDecision: (accepted: boolean, reason?: string) => void
}

const AppContext = createContext<AppContextType | null>(null)
const getTime = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date())

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [lang, setLang] = useState<Lang>('en')
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS)
  const [selectedConditionId, setSelectedConditionId] = useState('cardiac-arrest')
  const [journeyState, setJourneyState] = useState<JourneyState>('idle')
  const [destinationId, setDestinationId] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([])
  useEffect(() => { document.body.dataset.lang = lang }, [lang])
  const requiredFacilities = CONDITIONS.find((condition) => condition.id === selectedConditionId)?.requiredFacilities
  const assessments = useMemo(() => assessHospitals(hospitals, requiredFacilities), [hospitals, requiredFacilities])
  const recommendation = useMemo(() => recommendHospital(hospitals, requiredFacilities), [hospitals, requiredFacilities])
  const addAudit = (text: string, tone: AuditEvent['tone'] = 'blue') => setAuditLog((previous) => [{ id: Date.now() + Math.random(), text, tone, time: getTime() }, ...previous])

  const dispatch = (options?: { helper?: boolean }) => {
    const first = recommendHospital(hospitals, requiredFacilities)
    if (!first) return
    setDestinationId(first.id); setJourneyState('en-route')
    const condition = CONDITIONS.find((item) => item.id === selectedConditionId)
    addAudit(`${condition?.name ?? 'Emergency'} request created with simulated requirements`)
    addAudit(`${first.name} recommended: shortest eligible ETA`, 'green')
    addAudit(`Simulated ambulance unit assigned with required capability kit`, 'green')
    if (options?.helper) addAudit('SOS support: 2 simulated helpers assigned to accompany the nearest ambulance', 'red')
    addAudit(`Journey started toward ${first.name}`, 'amber')
  }

  const updateMetroStatus = (update: Pick<Hospital, 'icuBeds' | 'cardiacSpecialist' | 'erStatus'>) => {
    const updated = hospitals.map((hospital) => hospital.id === 'metro' ? { ...hospital, ...update } : hospital)
    setHospitals(updated)
    addAudit(`Metro Care Centre status updated: ICU ${update.icuBeds}, ER ${update.erStatus}`)
    const next = recommendHospital(updated, requiredFacilities)
    if (journeyState === 'en-route' && destinationId === 'metro' && next?.id !== 'metro') {
      setJourneyState('reroute-required')
      addAudit('Destination reassessment triggered: Metro Care Centre is no longer eligible', 'red')
      if (next) addAudit(`${next.name} proposed as next eligible destination`, 'amber')
    }
  }

  const confirmReroute = () => {
    if (!recommendation) return
    setDestinationId(recommendation.id); setJourneyState('rerouted')
    addAudit(`Updated destination confirmed: ${recommendation.name}`, 'green')
  }
  const keepCurrentDestination = () => { setJourneyState('en-route'); addAudit('Current destination retained by simulated user', 'amber') }
  const recordHospitalDecision = (accepted: boolean, reason = 'Resource constraint') => {
    addAudit(accepted ? 'Metro Care Centre accepted simulated patient request' : `Metro Care Centre rejected simulated patient request: ${reason}`, accepted ? 'green' : 'red')
  }

  return <AppContext.Provider value={{ role, setRole, lang, setLang, hospitals, assessments, recommendation, selectedConditionId, setSelectedConditionId, journeyState, destinationId, auditLog, dispatch, updateMetroStatus, confirmReroute, keepCurrentDestination, recordHospitalDecision }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
