export type PronounId = 'he-him' | 'she-her' | 'they-them'

export const PRONOUN_IDS = [
  'he-him',
  'she-her',
  'they-them',
] as const satisfies readonly PronounId[]

export const PRONOUN_LABELS: Record<PronounId, string> = {
  'he-him': 'He/Him',
  'she-her': 'She/Her',
  'they-them': 'They/Them',
}

export function isPronounId(value: unknown): value is PronounId {
  return typeof value === 'string' && (PRONOUN_IDS as readonly string[]).includes(value)
}

export function getPronounLabel(pronounId: PronounId): string {
  return PRONOUN_LABELS[pronounId]
}
