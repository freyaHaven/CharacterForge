export type GenderId = 'female' | 'male' | 'non-binary'

export const GENDER_IDS = [
  'female',
  'male',
  'non-binary',
] as const satisfies readonly GenderId[]

export const GENDER_LABELS: Record<GenderId, string> = {
  female: 'Female',
  male: 'Male',
  'non-binary': 'Non-Binary',
}

export function isGenderId(value: unknown): value is GenderId {
  return typeof value === 'string' && (GENDER_IDS as readonly string[]).includes(value)
}

export function getGenderLabel(genderId: GenderId): string {
  return GENDER_LABELS[genderId]
}
