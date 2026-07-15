export const SKILL_IDS = [
  'acrobatics',
  'animal-handling',
  'arcana',
  'athletics',
  'history',
  'insight',
  'intimidation',
  'perception',
  'persuasion',
  'religion',
  'sleight-of-hand',
  'stealth',
  'survival',
] as const

export type SkillId = (typeof SKILL_IDS)[number]

export function isSkillId(value: unknown): value is SkillId {
  return (
    typeof value === 'string' &&
    (SKILL_IDS as readonly string[]).includes(value)
  )
}

export const SKILL_LABELS: Record<SkillId, string> = {
  acrobatics: 'Acrobatics',
  'animal-handling': 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  perception: 'Perception',
  persuasion: 'Persuasion',
  religion: 'Religion',
  'sleight-of-hand': 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
}
