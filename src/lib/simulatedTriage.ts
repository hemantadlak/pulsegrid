import { CONDITIONS, type Condition } from '../conditions'

const keywordGroups: Array<{ words: string[]; conditionId: string }> = [
  { words: ['chest', 'heart', 'cardiac', 'palpitation', 'सीना', 'छाती', 'दिल', 'हार्ट', 'धड़कन'], conditionId: 'cardiac-arrest' },
  { words: ['speech', 'face', 'stroke', 'weakness', 'numb', 'लकवा', 'चेहरा', 'बोल', 'कमज़ोरी', 'कमजोरी'], conditionId: 'stroke' },
  { words: ['breath', 'asthma', 'oxygen', 'wheez', 'सांस', 'श्वास', 'दमा', 'ऑक्सीजन'], conditionId: 'breathing' },
  { words: ['bleed', 'blood', 'wound', 'cut', 'खून', 'रक्तस्राव', 'कट', 'चोट'], conditionId: 'bleeding' },
  { words: ['fall', 'accident', 'trauma', 'collision', 'दुर्घटना', 'हादसा', 'एक्सीडेंट', 'गिर'], conditionId: 'severe-trauma' },
  { words: ['burn', 'scald', 'जल', 'आग'], conditionId: 'burns' },
  { words: ['unconscious', 'faint', 'unresponsive', 'बेहोश'], conditionId: 'unconscious' },
  { words: ['poison', 'tablet', 'ingest', 'ज़हर', 'जहर'], conditionId: 'poisoning' },
  { words: ['allergy', 'allergic', 'swelling', 'एलर्जी', 'सूजन'], conditionId: 'allergic' },
  { words: ['fracture', 'broken', 'bone', 'हड्डी', 'फ्रैक्चर'], conditionId: 'fracture' },
  { words: ['sugar', 'diabetic', 'diabetes', 'शुगर', 'मधुमेह'], conditionId: 'diabetic' },
  { words: ['pregnan', 'labour', 'labor', 'childbirth', 'गर्भ', 'प्रसव'], conditionId: 'childbirth' },
]

/**
 * A local-only keyword matcher for the PULSEGRID simulation. It does not diagnose,
 * make clinical decisions, or send text/audio to any service.
 */
export function matchSimulatedCondition(text: string): Condition {
  const normalized = text.toLowerCase()
  const matched = keywordGroups.find(({ words }) => words.some((word) => normalized.includes(word)))
  return CONDITIONS.find((condition) => condition.id === matched?.conditionId) ?? CONDITIONS[0]
}
