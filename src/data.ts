export type Hospital = {
  id: string
  name: string
  etaMinutes: number
  icuBeds: number
  cardiacSpecialist: boolean
  erStatus: 'accepting' | 'limited' | 'diverting'
  lat: number
  lng: number
  facilities: string[]
}

export const INITIAL_HOSPITALS: Hospital[] = [
  { id: 'northstar', name: 'Northstar Medical', etaMinutes: 6, icuBeds: 3, cardiacSpecialist: false, erStatus: 'accepting', lat: 30.7398, lng: 76.782, facilities: ['Emergency Medicine', 'Orthopedics', 'X-Ray'] },
  { id: 'metro', name: 'Metro Care Centre', etaMinutes: 11, icuBeds: 1, cardiacSpecialist: true, erStatus: 'accepting', lat: 30.7262, lng: 76.7888, facilities: ['Cardiac ICU', 'Cardiologist', 'Defibrillator', 'Cath Lab', 'Emergency Medicine', 'ICU', 'CT Scanner'] },
  { id: 'riverbend', name: 'Riverbend Hospital', etaMinutes: 15, icuBeds: 2, cardiacSpecialist: true, erStatus: 'accepting', lat: 30.7462, lng: 76.7985, facilities: ['Cardiac ICU', 'Cardiologist', 'Defibrillator', 'Cath Lab', 'Emergency Medicine', 'ICU', 'CT Scanner', 'Trauma Bay', 'Blood Bank', 'General Surgery', 'Orthopedics', 'X-Ray', 'Ventilator', 'Oxygen Supply', 'Neurology', 'Stroke Unit'] },
]

export const INCOMING_REQUESTS = [
  { id: 1, badge: 'Critical', badgeColor: 'red' as const, type: 'Cardiac care', eta: '8 min' },
]

// Deliberately fictional inventory for the hackathon simulation. It is never
// intended to show real blood, plasma, availability, or price information.
export const DEMO_BLOOD_SUPPORT = [
  { hospital: 'Metro Care Centre', eta: 11, blood: ['A+', 'O+'], plasma: ['AB plasma'], price: '₹1,200 demo value' },
  { hospital: 'Riverbend Hospital', eta: 15, blood: ['O−', 'B+', 'AB+'], plasma: ['A plasma', 'O plasma'], price: '₹1,450 demo value' },
  { hospital: 'Northstar Medical', eta: 6, blood: ['B−'], plasma: [], price: '₹1,000 demo value' },
]
