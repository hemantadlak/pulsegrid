import { CONDITIONS, type Condition } from '../conditions'

const keywordGroups: Array<{ words: string[]; conditionId: string }> = [
  { words: ['chest', 'heart', 'cardiac', 'palpitation'], conditionId: 'cardiac-arrest' },
  { words: ['speech', 'face', 'stroke', 'weakness', 'numb'], conditionId: 'stroke' },
  { words: ['breath', 'asthma', 'oxygen', 'wheez'], conditionId: 'breathing' },
  { words: ['bleed', 'blood', 'wound', 'cut'], conditionId: 'bleeding' },
  { words: ['fall', 'accident', 'trauma', 'collision'], conditionId: 'severe-trauma' },
  { words: ['burn', 'scald'], conditionId: 'burns' },
  { words: ['unconscious', 'faint', 'unresponsive'], conditionId: 'unconscious' },
  { words: ['poison', 'tablet', 'ingest'], conditionId: 'poisoning' },
  { words: ['allergy', 'allergic', 'swelling'], conditionId: 'allergic' },
  { words: ['fracture', 'broken', 'bone'], conditionId: 'fracture' },
  { words: ['sugar', 'diabetic', 'diabetes'], conditionId: 'diabetic' },
  { words: ['pregnan', 'labour', 'labor', 'childbirth'], conditionId: 'childbirth' },
]

/**
 * A local-only keyword matcher for the PULSEGRID demo. It does not diagnose,
 * make clinical decisions, or send text/audio to any service.
 */
export function matchSimulatedCondition(text: string): Condition {
  const normalized = text.toLowerCase()
  const matched = keywordGroups.find(({ words }) => words.some((word) => normalized.includes(word)))
  return CONDITIONS.find((condition) => condition.id === matched?.conditionId) ?? CONDITIONS[0]
}
