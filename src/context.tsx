import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { INITIAL_HOSPITALS, type Hospital } from './data'
import { assessHospitals, recommendHospital, type HospitalAssessment } from './decisionEngine'
import { CONDITIONS } from './conditions'
import type { Lang } from './i18n'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export type Role = 'emergency' | 'coordinator' | null
export type JourneyState = 'idle' | 'en-route' | 'reroute-required' | 'rerouted'
export type AuditEvent = { id: number; text: string; time: string; tone: 'blue' | 'green' | 'amber' | 'red' }
type AuthResult = { error: string | null; message?: string }
type DispatchOptions = { helper?: boolean; conditionId?: string; source?: 'sos-voice' }
type DatabaseHospital = { id: string; name: string; eta_minutes: number; icu_beds: number; cardiac_specialist: boolean; er_status: Hospital['erStatus']; lat: number; lng: number; facilities: string[] }

interface AppContextType {
  role: Role; setRole: (role: Role) => void; lang: Lang; setLang: (lang: Lang) => void
  hospitals: Hospital[]; assessments: HospitalAssessment[]; recommendation: HospitalAssessment | null
  selectedConditionId: string; setSelectedConditionId: (id: string) => void
  journeyState: JourneyState; destinationId: string | null; auditLog: AuditEvent[]
  dispatch: (options?: DispatchOptions) => void
  startCriticalScenario: () => void
  updateMetroStatus: (update: Pick<Hospital, 'icuBeds' | 'cardiacSpecialist' | 'erStatus'>) => void
  confirmReroute: () => void; keepCurrentDestination: () => void
  recordHospitalDecision: (accepted: boolean, reason?: string) => void
  authUser: User | null; backendReady: boolean; authBusy: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, role: Exclude<Role, null>) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)
const getTime = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date())
const mapHospital = (row: DatabaseHospital): Hospital => ({ id: row.id, name: row.name, etaMinutes: row.eta_minutes, icuBeds: row.icu_beds, cardiacSpecialist: row.cardiac_specialist, erStatus: row.er_status, lat: row.lat, lng: row.lng, facilities: row.facilities ?? [] })
const mapRole = (value?: string | null): Role => value === 'hospital_coordinator' ? 'coordinator' : value === 'emergency_user' ? 'emergency' : null

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [lang, setLang] = useState<Lang>('en')
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS)
  const [selectedConditionId, setSelectedConditionId] = useState('cardiac-arrest')
  const [journeyState, setJourneyState] = useState<JourneyState>('idle')
  const [destinationId, setDestinationId] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([])
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authBusy, setAuthBusy] = useState(isSupabaseConfigured)

  useEffect(() => { document.body.dataset.lang = lang }, [lang])
  const requiredFacilities = CONDITIONS.find((condition) => condition.id === selectedConditionId)?.requiredFacilities
  const assessments = useMemo(() => assessHospitals(hospitals, requiredFacilities), [hospitals, requiredFacilities])
  const recommendation = useMemo(() => recommendHospital(hospitals, requiredFacilities), [hospitals, requiredFacilities])

  const addAudit = (text: string, tone: AuditEvent['tone'] = 'blue', incidentId = activeIncidentId) => {
    const event = { id: Date.now() + Math.random(), text, tone, time: getTime() } satisfies AuditEvent
    setAuditLog((previous) => [event, ...previous])
    if (supabase && authUser) {
      void supabase.from('audit_events').insert({ incident_id: incidentId, patient_id: authUser.id, event_text: text, source: role === 'coordinator' ? 'hospital_coordinator' : 'emergency_user', tone })
    }
  }

  useEffect(() => {
    if (!supabase) { setAuthBusy(false); return }
    void supabase.auth.getSession().then(({ data }) => { setAuthUser(data.session?.user ?? null); setAuthBusy(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAuthUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client || !authUser) return
    let active = true
    void (async () => {
      const [{ data: hospitalRows }, { data: profile }, { data: events }] = await Promise.all([
        client.from('hospitals').select('*').order('eta_minutes'),
        client.from('profiles').select('role').eq('id', authUser.id).maybeSingle(),
        client.from('audit_events').select('*').eq('patient_id', authUser.id).order('created_at', { ascending: false }).limit(50),
      ])
      if (!active) return
      if (hospitalRows?.length) setHospitals((hospitalRows as DatabaseHospital[]).map(mapHospital))
      const storedRole = mapRole(profile?.role)
      if (storedRole) setRole(storedRole)
      if (events?.length) setAuditLog(events.map((event) => ({ id: Date.parse(event.created_at) + Math.random(), text: event.event_text, tone: event.tone, time: getTime() })))
    })()
    const channel = client.channel(`pulsegrid-${authUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, (payload) => {
        const row = payload.new as DatabaseHospital
        if (row?.id) setHospitals((current) => current.map((hospital) => hospital.id === row.id ? mapHospital(row) : hospital))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_events', filter: `patient_id=eq.${authUser.id}` }, (payload) => {
        const row = payload.new as { event_text: string; tone: AuditEvent['tone']; created_at: string }
        setAuditLog((current) => [{ id: Date.parse(row.created_at) + Math.random(), text: row.event_text, tone: row.tone, time: getTime() }, ...current])
      }).subscribe()
    return () => { active = false; void client.removeChannel(channel) }
  }, [authUser])

  const dispatch = (options?: DispatchOptions) => {
    const conditionId = options?.conditionId ?? selectedConditionId
    const condition = CONDITIONS.find((item) => item.id === conditionId)
    const facilities = condition?.requiredFacilities
    const first = recommendHospital(hospitals, facilities)
    if (!first) return
    setSelectedConditionId(conditionId)
    setDestinationId(first.id); setJourneyState('en-route')
    const events: Array<[string, AuditEvent['tone']]> = [
      ...(options?.source === 'sos-voice' ? [[`SOS voice capture matched a fictional ${condition?.name ?? 'emergency'} scenario locally`, 'blue'] as [string, AuditEvent['tone']]] : []),
      [`${condition?.name ?? 'Emergency'} request created with simulated requirements`, 'blue'],
      [`${first.name} recommended: shortest eligible ETA`, 'green'],
      ['Simulated ambulance unit assigned with required capability kit', 'green'],
      ...(options?.helper ? [['SOS support: 2 simulated helpers assigned to accompany the nearest ambulance', 'red'] as [string, AuditEvent['tone']]] : []),
      [`Journey started toward ${first.name}`, 'amber'],
    ]
    if (supabase && authUser) {
      void supabase.from('incidents').insert({ patient_id: authUser.id, condition_id: conditionId, destination_id: first.id, journey_status: 'en-route', simulated_eta_minutes: first.etaMinutes }).select('id').single().then(({ data }) => {
        if (data?.id) { setActiveIncidentId(data.id); events.forEach(([text, tone]) => addAudit(text, tone, data.id)) }
      })
    } else events.forEach(([text, tone]) => addAudit(text, tone))
  }

  const startCriticalScenario = () => {
    const scenario = CONDITIONS.find((item) => item.id === 'cardiac-arrest')!
    const readyHospitals = hospitals.map((hospital) => hospital.id === 'metro'
      ? { ...hospital, icuBeds: 1, cardiacSpecialist: true, erStatus: 'accepting' as const }
      : hospital)
    const first = recommendHospital(readyHospitals, scenario.requiredFacilities)
    if (!first) {
      addAudit('Critical demo scenario could not find an eligible fictional hospital', 'red')
      return
    }
    setHospitals(readyHospitals)
    setSelectedConditionId(scenario.id)
    setDestinationId(first.id)
    setJourneyState('en-route')
    addAudit('Critical cardiac scenario started — fictional data only', 'red')
    addAudit(`${first.name} initially selected after capability and simulated ETA checks`, 'green')
    addAudit('Simulated ambulance journey started; human reroute approval remains required', 'amber')

    window.setTimeout(() => {
      const updatedHospitals = readyHospitals.map((hospital) => hospital.id === 'metro' ? { ...hospital, icuBeds: 0 } : hospital)
      setHospitals(updatedHospitals)
      if (supabase) void supabase.from('hospitals').update({ icu_beds: 0, updated_at: new Date().toISOString() }).eq('id', 'metro')
      addAudit('Metro Care Centre simulated ICU capacity changed to unavailable', 'red')
      const next = recommendHospital(updatedHospitals, scenario.requiredFacilities)
      if (first.id === 'metro' && next?.id && next.id !== 'metro') {
        setJourneyState('reroute-required')
        addAudit(`${next.name} proposed as the next eligible fictional destination`, 'amber')
      }
    }, 3600)
  }

  const updateMetroStatus = (update: Pick<Hospital, 'icuBeds' | 'cardiacSpecialist' | 'erStatus'>) => {
    const updated = hospitals.map((hospital) => hospital.id === 'metro' ? { ...hospital, ...update } : hospital)
    setHospitals(updated)
    if (supabase) void supabase.from('hospitals').update({ icu_beds: update.icuBeds, cardiac_specialist: update.cardiacSpecialist, er_status: update.erStatus, updated_at: new Date().toISOString() }).eq('id', 'metro')
    addAudit(`Metro Care Centre status updated: ICU ${update.icuBeds}, ER ${update.erStatus}`)
    const next = recommendHospital(updated, requiredFacilities)
    if (journeyState === 'en-route' && destinationId === 'metro' && next?.id !== 'metro') {
      setJourneyState('reroute-required')
      if (supabase && activeIncidentId) void supabase.from('incidents').update({ journey_status: 'reroute-required' }).eq('id', activeIncidentId)
      addAudit('Destination reassessment triggered: Metro Care Centre is no longer eligible', 'red')
      if (next) addAudit(`${next.name} proposed as next eligible destination`, 'amber')
    }
  }

  const confirmReroute = () => {
    if (!recommendation) return
    setDestinationId(recommendation.id); setJourneyState('rerouted')
    if (supabase && activeIncidentId) void supabase.from('incidents').update({ journey_status: 'rerouted', destination_id: recommendation.id, simulated_eta_minutes: recommendation.etaMinutes }).eq('id', activeIncidentId)
    addAudit(`Updated destination confirmed: ${recommendation.name}`, 'green')
  }
  const keepCurrentDestination = () => { setJourneyState('en-route'); addAudit('Current destination retained by simulated user', 'amber') }
  const recordHospitalDecision = (accepted: boolean, reason = 'Resource constraint') => {
    if (supabase && activeIncidentId) void supabase.from('incidents').update({ journey_status: accepted ? 'accepted' : 'rejected' }).eq('id', activeIncidentId)
    addAudit(accepted ? 'Metro Care Centre accepted simulated patient request' : `Metro Care Centre rejected simulated patient request: ${reason}`, accepted ? 'green' : 'red')
  }
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Connect Supabase in .env.local to use account sign-in.' }
    setAuthBusy(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); setAuthBusy(false)
    return { error: error?.message ?? null }
  }
  const signUp = async (email: string, password: string, selectedRole: Exclude<Role, null>): Promise<AuthResult> => {
    if (!supabase) return { error: 'Connect Supabase in .env.local to create an account.' }
    setAuthBusy(true); const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role: selectedRole === 'coordinator' ? 'hospital_coordinator' : 'emergency_user', display_name: 'Demo user' } } }); setAuthBusy(false)
    return { error: error?.message ?? null, message: data.session ? 'Account created.' : 'Account created. Check your email to confirm it.' }
  }
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setAuthUser(null); setRole(null); setActiveIncidentId(null) }

  return <AppContext.Provider value={{ role, setRole, lang, setLang, hospitals, assessments, recommendation, selectedConditionId, setSelectedConditionId, journeyState, destinationId, auditLog, dispatch, startCriticalScenario, updateMetroStatus, confirmReroute, keepCurrentDestination, recordHospitalDecision, authUser, backendReady: isSupabaseConfigured, authBusy, signIn, signUp, signOut }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
