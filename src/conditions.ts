export type Condition = { id: string; name: string; severity: 'critical' | 'high' | 'medium'; requiredFacilities: string[]; description: string }

export const CONDITIONS: Condition[] = [
  { id: 'cardiac-arrest', name: 'Cardiac care', severity: 'critical', requiredFacilities: ['Cardiac ICU', 'Cardiologist', 'Defibrillator', 'Cath Lab'], description: 'Requires specialised cardiac capability' },
  { id: 'stroke', name: 'Stroke', severity: 'critical', requiredFacilities: ['Neurology', 'CT Scanner', 'Stroke Unit'], description: 'Requires stroke-response capability' },
  { id: 'severe-trauma', name: 'Severe trauma', severity: 'critical', requiredFacilities: ['Trauma Bay', 'General Surgery', 'Orthopedics', 'Blood Bank'], description: 'Requires trauma and surgical capability' },
  { id: 'breathing', name: 'Difficulty breathing', severity: 'high', requiredFacilities: ['Ventilator', 'Oxygen Supply', 'ICU'], description: 'Requires respiratory support' },
  { id: 'burns', name: 'Burns', severity: 'critical', requiredFacilities: ['Burns Unit', 'Plastic Surgery', 'ICU'], description: 'Requires burns capability' },
  { id: 'unconscious', name: 'Unconscious', severity: 'critical', requiredFacilities: ['ICU', 'Neurology', 'CT Scanner'], description: 'Requires critical-care capability' },
  { id: 'bleeding', name: 'Severe bleeding', severity: 'high', requiredFacilities: ['Blood Bank', 'General Surgery'], description: 'Requires surgical and blood-bank support' },
  { id: 'poisoning', name: 'Poisoning', severity: 'high', requiredFacilities: ['Toxicology', 'ICU'], description: 'Requires toxicology support' },
  { id: 'allergic', name: 'Allergic reaction', severity: 'high', requiredFacilities: ['Emergency Medicine', 'ICU'], description: 'Requires emergency response capability' },
  { id: 'fracture', name: 'Fracture', severity: 'medium', requiredFacilities: ['Orthopedics', 'X-Ray'], description: 'Requires orthopedic capability' },
  { id: 'diabetic', name: 'Diabetic emergency', severity: 'medium', requiredFacilities: ['Emergency Medicine'], description: 'Requires emergency monitoring' },
  { id: 'childbirth', name: 'Childbirth', severity: 'medium', requiredFacilities: ['Maternity Ward'], description: 'Requires maternity capability' },
]
