// PULSEGRID — i18n translations (English / Hindi)

export type Lang = 'en' | 'hi'

export const translations = {
  // --- Auth / Login ---
  tagline: { en: 'Emergency Dispatch Intelligence', hi: 'आपातकालीन प्रेषण खुफिया' },
  selectRole: { en: 'Select your role to continue', hi: 'जारी रखने के लिए अपनी भूमिका चुनें' },
  emergencyUser: { en: 'Emergency User', hi: 'आपातकालीन उपयोगकर्ता' },
  emergencyUserSub: { en: 'Request & track emergency dispatch', hi: 'आपातकालीन प्रेषण का अनुरोध करें और ट्रैक करें' },
  hospitalCoordinator: { en: 'Hospital Coordinator', hi: 'अस्पताल समन्वयक' },
  hospitalCoordinatorSub: { en: 'Manage hospital capacity & status', hi: 'अस्पताल की क्षमता और स्थिति प्रबंधित करें' },
  enterSimulation: { en: 'Open PULSEGRID →', hi: 'पल्सग्रिड खोलें →' },
  noRealData: { en: 'No real data is collected or transmitted.', hi: 'कोई वास्तविक डेटा एकत्र या प्रसारित नहीं किया जाता।' },

  // --- Nav / Global ---
  signOut: { en: 'Sign Out', hi: 'साइन आउट' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  dispatch: { en: 'Dispatch', hi: 'प्रेषण' },
  hospitals: { en: 'Hospitals', hi: 'अस्पताल' },
  alerts: { en: 'Alerts', hi: 'अलर्ट' },
  capacity: { en: 'Capacity', hi: 'क्षमता' },
  eventLog: { en: 'Event Log', hi: 'घटना लॉग' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },

  // --- Emergency Dashboard ---
  newDispatch: { en: 'New Dispatch Request', hi: 'नया प्रेषण अनुरोध' },
  newDispatchSub: { en: 'Select emergency type and request assistance', hi: 'आपातकाल प्रकार चुनें और सहायता का अनुरोध करें' },
  cardiacCare: { en: 'Cardiac Care', hi: 'कार्डियक केयर' },
  traumaCare: { en: 'Trauma Care', hi: 'ट्रॉमा केयर' },
  icuRequired: { en: 'ICU Required', hi: 'ICU आवश्यक' },
  requestAssistance: { en: 'REQUEST ASSISTANCE', hi: 'सहायता अनुरोध करें' },
  dispatched: { en: '✓ DISPATCHED', hi: '✓ प्रेषित' },

  unitStatus: { en: 'UNIT STATUS', hi: 'इकाई स्थिति' },
  enRoute: { en: 'EN ROUTE', hi: 'एम्बुलेंस रास्ते में' },
  unitId: { en: 'Unit ID', hi: 'इकाई आईडी' },
  driver: { en: 'Driver', hi: 'चालक' },
  vehicle: { en: 'Vehicle', hi: 'वाहन' },
  gps: { en: 'GPS', hi: 'जीपीएस' },
  active: { en: 'Active', hi: 'सक्रिय' },

  bestMatch: { en: 'BEST MATCH', hi: 'सर्वश्रेष्ठ मिलान' },
  compatibilityScore: { en: 'Compatibility Score', hi: 'अनुकूलता स्कोर' },
  allHospitals: { en: 'All Hospitals', hi: 'सभी अस्पताल' },
  rank: { en: 'Rank', hi: 'रैंक' },
  hospital: { en: 'Hospital', hi: 'अस्पताल' },
  distance: { en: 'Distance', hi: 'दूरी' },
  icu: { en: 'ICU', hi: 'आईसीयू' },
  specialist: { en: 'Specialist', hi: 'विशेषज्ञ' },
  status: { en: 'Status', hi: 'स्थिति' },

  dispatchAlerts: { en: 'DISPATCH ALERTS', hi: 'प्रेषण अलर्ट' },
  liveRoute: { en: '● LIVE ROUTE', hi: '● लाइव रूट' },
  eta: { en: 'ETA', hi: 'अनुमानित समय' },

  // --- Hospital Coordinator ---
  readinessControls: { en: 'Readiness Controls', hi: 'तत्परता नियंत्रण' },
  icuBeds: { en: 'ICU Beds Available', hi: 'ICU बेड उपलब्ध' },
  specialistOnDuty: { en: 'Specialist On-Duty', hi: 'ड्यूटी पर विशेषज्ञ' },
  erStatus: { en: 'ER Status', hi: 'ER स्थिति' },
  traumaBay: { en: 'Trauma Bay', hi: 'ट्रॉमा बे' },
  accepting: { en: 'Accepting', hi: 'स्वीकार' },
  limited: { en: 'Limited', hi: 'सीमित' },
  diverting: { en: 'Diverting', hi: 'मोड़' },
  updateStatus: { en: 'UPDATE STATUS', hi: 'स्थिति अपडेट करें' },
  lastSaved: { en: 'Last saved at 14:32 · 2 min ago', hi: 'अंतिम बार 14:32 पर सहेजा · 2 मिनट पहले' },

  incomingRequests: { en: 'Incoming Requests', hi: 'आने वाले अनुरोध' },
  accept: { en: 'ACCEPT', hi: 'स्वीकार करें' },
  redirect: { en: 'REDIRECT', hi: 'पुनर्निर्देशित करें' },

  export: { en: 'EXPORT', hi: 'निर्यात' },
  activityHeatmap: { en: 'Activity Heatmap — Today', hi: 'गतिविधि हीटमैप — आज' },

  // --- Hospital header ---
  lastUpdated: { en: 'Last updated 2 min ago', hi: '2 मिनट पहले अपडेट किया गया' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key][lang]
}
