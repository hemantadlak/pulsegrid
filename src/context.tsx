import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { INITIAL_HOSPITALS, type Hospital } from './data'
import { assessHospitals, recommendHospital, type HospitalAssessment } from './decisionEngine'
import { CONDITIONS } from './conditions'
import type { Lang } from './i18n'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export type Role = 'emergency' | 'coordinator' | null
export type JourneyState = 'idle' | 'en-route' | 'reroute-required' | 'rerouted'
export type AuditEvent = { id: number; text: string; time: string; tone: 'blue' | 'green' | 'amber' | 'red' }
export type SimulationAlert = AuditEvent & { audience: 'emergency' | 'coordinator' | 'all' }
type AuthResult = { error: string | null; message?: string }
type DispatchOptions = { helper?: boolean; conditionId?: string; source?: 'sos-voice' }
type DatabaseHospital = { id: string; name: string; eta_minutes: number; icu_beds: number; cardiac_specialist: boolean; er_status: Hospital['erStatus']; lat: number; lng: number; facilities: string[] }
type SharedHospitalStatus = Pick<Hospital, 'icuBeds' | 'cardiacSpecialist' | 'erStatus'>
type LiveSyncEvent =
  | { type: 'hospital-status'; hospitalId: string; status: SharedHospitalStatus }
  | { type: 'journey'; journeyState: JourneyState; destinationId: string | null; conditionId?: string }
  | { type: 'audit'; event: AuditEvent }
  | { type: 'alert'; alert: SimulationAlert }

interface AppContextType {
  role: Role; setRole: (role: Role) => void; lang: Lang; setLang: (lang: Lang) => void
  hospitals: Hospital[]; assessments: HospitalAssessment[]; recommendation: HospitalAssessment | null
  selectedConditionId: string; setSelectedConditionId: (id: string) => void
  journeyState: JourneyState; destinationId: string | null; auditLog: AuditEvent[]; alerts: SimulationAlert[]
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
  const [alerts, setAlerts] = useState<SimulationAlert[]>([])
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authBusy, setAuthBusy] = useState(isSupabaseConfigured)
  const syncChannelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => { document.body.dataset.lang = lang }, [lang])
  const requiredFacilities = CONDITIONS.find((condition) => condition.id === selectedConditionId)?.requiredFacilities
  const assessments = useMemo(() => assessHospitals(hospitals, requiredFacilities), [hospitals, requiredFacilities])
  const recommendation = useMemo(() => recommendHospital(hospitals, requiredFacilities), [hospitals, requiredFacilities])

  const addAudit = (text: string, tone: AuditEvent['tone'] = 'blue', incidentId = activeIncidentId) => {
    const event = { id: Date.now() + Math.random(), text, tone, time: getTime() } satisfies AuditEvent
    setAuditLog((previous) => [event, ...previous])
    syncChannelRef.current?.postMessage({ type: 'audit', event } satisfies LiveSyncEvent)
    if (supabase && authUser) {
      void supabase.from('audit_events').insert({ incident_id: incidentId, patient_id: authUser.id, event_text: text, source: role === 'coordinator' ? 'hospital_coordinator' : 'emergency_user', tone })
    }
  }

  const addAlert = (text: string, tone: AuditEvent['tone'], audience: SimulationAlert['audience']) => {
    const alert = { id: Date.now() + Math.random(), text, tone, time: getTime(), audience } satisfies SimulationAlert
    setAlerts((previous) => [alert, ...previous].slice(0, 20))
    syncChannelRef.current?.postMessage({ type: 'alert', alert } satisfies LiveSyncEvent)
  }

  const broadcastJourney = (nextJourneyState: JourneyState, nextDestinationId: string | null, conditionId = selectedConditionId) => {
    syncChannelRef.current?.postMessage({ type: 'journey', journeyState: nextJourneyState, destinationId: nextDestinationId, conditionId } satisfies LiveSyncEvent)
  }

  const broadcastHospitalStatus = (hospitalId: string, status: SharedHospitalStatus) => {
    syncChannelRef.current?.postMessage({ type: 'hospital-status', hospitalId, status } satisfies LiveSyncEvent)
  }

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return
    const channel = new BroadcastChannel('pulsegrid-live-simulation')
    syncChannelRef.current = channel
    channel.onmessage = ({ data }: MessageEvent<LiveSyncEvent>) => {
      if (data.type === 'hospital-status') {
        setHospitals((current) => current.map((hospital) => hospital.id === data.hospitalId ? { ...hospital, ...data.status } : hospital))
      }
      if (data.type === 'journey') {
        setJourneyState(data.journeyState)
        setDestinationId(data.destinationId)
        if (data.conditionId && CONDITIONS.some((condition) => condition.id === data.conditionId)) setSelectedConditionId(data.conditionId)
      }
      if (data.type === 'audit') {
        setAuditLog((current) => current.some((event) => event.id === data.event.id) ? current : [data.event, ...current])
      }
      if (data.type === 'alert') {
        setAlerts((current) => current.some((alert) => alert.id === data.alert.id) ? current : [data.alert, ...current].slice(0, 20))
      }
    }
    return () => {
      syncChannelRef.current = null
      channel.close()
    }
  }, [])

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
    broadcastJourney('en-route', first.id, conditionId)
    if (options?.source === 'sos-voice') {
      addAlert(`New fictional SOS request: ${condition?.name ?? 'emergency'} · ${facilities?.join(', ') ?? 'capability check required'}`, 'red', 'coordinator')
      addAlert(`Fictional SOS support assigned. ${first.name} is the capability-first destination.`, 'green', 'emergency')
    }
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
      addAudit('Critical simulation scenario could not find an eligible fictional hospital', 'red')
      return
    }
    setHospitals(readyHospitals)
    setSelectedConditionId(scenario.id)
    setDestinationId(first.id)
    setJourneyState('en-route')
    broadcastHospitalStatus('metro', { icuBeds: 1, cardiacSpecialist: true, erStatus: 'accepting' })
    broadcastJourney('en-route', first.id, scenario.id)
    addAudit('Critical cardiac scenario started — fictional data only', 'red')
    addAudit(`${first.name} initially selected after capability and simulated ETA checks`, 'green')
    addAudit('Simulated ambulance journey started; human reroute approval remains required', 'amber')

    window.setTimeout(() => {
      const updatedHospitals = readyHospitals.map((hospital) => hospital.id === 'metro' ? { ...hospital, icuBeds: 0 } : hospital)
      setHospitals(updatedHospitals)
      broadcastHospitalStatus('metro', { icuBeds: 0, cardiacSpecialist: true, erStatus: 'accepting' })
      if (supabase) void supabase.from('hospitals').update({ icu_beds: 0, updated_at: new Date().toISOString() }).eq('id', 'metro')
      addAudit('Metro Care Centre simulated ICU capacity changed to unavailable', 'red')
      addAlert('Hospital resource update: Metro Care Centre ICU is unavailable. Reassessment is required.', 'red', 'emergency')
      const next = recommendHospital(updatedHospitals, scenario.requiredFacilities)
      if (first.id === 'metro' && next?.id && next.id !== 'metro') {
        setJourneyState('reroute-required')
        broadcastJourney('reroute-required', first.id)
        addAudit(`${next.name} proposed as the next eligible fictional destination`, 'amber')
      }
    }, 3600)
  }

  const updateMetroStatus = (update: Pick<Hospital, 'icuBeds' | 'cardiacSpecialist' | 'erStatus'>) => {
    const updated = hospitals.map((hospital) => hospital.id === 'metro' ? { ...hospital, ...update } : hospital)
    setHospitals(updated)
    broadcastHospitalStatus('metro', update)
    if (supabase) void supabase.from('hospitals').update({ icu_beds: update.icuBeds, cardiac_specialist: update.cardiacSpecialist, er_status: update.erStatus, updated_at: new Date().toISOString() }).eq('id', 'metro')
    addAudit(`Metro Care Centre status updated: ICU ${update.icuBeds}, ER ${update.erStatus}`)
    const next = recommendHospital(updated, requiredFacilities)
    if (journeyState === 'en-route' && destinationId === 'metro' && next?.id !== 'metro') {
      setJourneyState('reroute-required')
      broadcastJourney('reroute-required', destinationId)
      if (supabase && activeIncidentId) void supabase.from('incidents').update({ journey_status: 'reroute-required' }).eq('id', activeIncidentId)
      addAudit('Destination reassessment triggered: Metro Care Centre is no longer eligible', 'red')
      addAlert('Hospital resource update: Metro Care Centre no longer meets the fictional journey requirements.', 'red', 'emergency')
      if (next) addAudit(`${next.name} proposed as next eligible destination`, 'amber')
    }
  }

  const confirmReroute = () => {
    if (!recommendation) return
    setDestinationId(recommendation.id); setJourneyState('rerouted')
    broadcastJourney('rerouted', recommendation.id)
    if (supabase && activeIncidentId) void supabase.from('incidents').update({ journey_status: 'rerouted', destination_id: recommendation.id, simulated_eta_minutes: recommendation.etaMinutes }).eq('id', activeIncidentId)
    addAudit(`Updated destination confirmed: ${recommendation.name}`, 'green')
    addAlert(`Updated fictional destination confirmed: ${recommendation.name}.`, 'green', 'emergency')
  }
  const keepCurrentDestination = () => { setJourneyState('en-route'); broadcastJourney('en-route', destinationId); addAudit('Current destination retained by simulated user', 'amber') }
  const recordHospitalDecision = (accepted: boolean, reason = 'Resource constraint') => {
    if (!accepted) {
      const updated = hospitals.map((hospital) => hospital.id === 'metro' ? { ...hospital, erStatus: 'diverting' as const } : hospital)
      const metro = updated.find((hospital) => hospital.id === 'metro')
      setHospitals(updated)
      if (metro) {
        broadcastHospitalStatus('metro', { icuBeds: metro.icuBeds, cardiacSpecialist: metro.cardiacSpecialist, erStatus: metro.erStatus })
        if (supabase) void supabase.from('hospitals').update({ er_status: 'diverting', updated_at: new Date().toISOString() }).eq('id', 'metro')
      }
      setJourneyState('reroute-required')
      broadcastJourney('reroute-required', destinationId)
    }
    if (supabase && activeIncidentId) void supabase.from('incidents').update({ journey_status: accepted ? 'accepted' : 'rejected' }).eq('id', activeIncidentId)
    addAudit(accepted ? 'Metro Care Centre accepted simulated patient request' : `Metro Care Centre rejected simulated patient request: ${reason}`, accepted ? 'green' : 'red')
    addAlert(accepted ? 'Metro Care Centre accepted the fictional request. Preparation is underway.' : 'Metro Care Centre declined the fictional request. A reroute confirmation is required.', accepted ? 'green' : 'red', 'emergency')
  }
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Connect Supabase in .env.local to use account sign-in.' }
    setAuthBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    } catch {
      return { error: 'Account service is unreachable. Check the Supabase project URL and internet connection, or continue in the fictional training workspace.' }
    } finally {
      setAuthBusy(false)
    }
  }
  const signUp = async (email: string, password: string, selectedRole: Exclude<Role, null>): Promise<AuthResult> => {
    if (!supabase) return { error: 'Connect Supabase in .env.local to create an account.' }
    setAuthBusy(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role: selectedRole === 'coordinator' ? 'hospital_coordinator' : 'emergency_user', display_name: 'Training user' } } })
      return { error: error?.message ?? null, message: data.session ? 'Account created.' : 'Account created. Check your email to confirm it.' }
    } catch {
      return { error: 'Account service is unreachable. Check the Supabase project URL and internet connection, or continue in the fictional training workspace.' }
    } finally {
      setAuthBusy(false)
    }
  }
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setAuthUser(null); setRole(null); setActiveIncidentId(null) }

  return <AppContext.Provider value={{ role, setRole, lang, setLang, hospitals, assessments, recommendation, selectedConditionId, setSelectedConditionId, journeyState, destinationId, auditLog, alerts, dispatch, startCriticalScenario, updateMetroStatus, confirmReroute, keepCurrentDestination, recordHospitalDecision, authUser, backendReady: isSupabaseConfigured, authBusy, signIn, signUp, signOut }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
