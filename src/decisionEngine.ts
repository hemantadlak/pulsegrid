import type { Hospital } from './data'

export type HospitalAssessment = Hospital & { eligible: boolean; reason: string }

export function assessHospitals(hospitals: Hospital[], requiredFacilities: string[] = ['Cardiac ICU', 'Cardiologist', 'Defibrillator', 'Cath Lab']): HospitalAssessment[] {
  return hospitals.map((hospital) => {
    if (hospital.erStatus !== 'accepting') return { ...hospital, eligible: false, reason: 'Emergency room is not accepting' }
    if (requiredFacilities.includes('Cardiologist') && !hospital.cardiacSpecialist) return { ...hospital, eligible: false, reason: 'Required cardiac specialist missing' }
    if (hospital.icuBeds < 1) return { ...hospital, eligible: false, reason: 'ICU bed unavailable' }
    const missing = requiredFacilities.find((facility) => !hospital.facilities.includes(facility))
    if (missing) return { ...hospital, eligible: false, reason: `Required facility missing: ${missing}` }
    return { ...hospital, eligible: true, reason: 'Eligible — required capabilities verified' }
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.etaMinutes - b.etaMinutes)
}

export function recommendHospital(hospitals: Hospital[], requiredFacilities?: string[]) {
  return assessHospitals(hospitals, requiredFacilities).find((hospital) => hospital.eligible) ?? null
}
