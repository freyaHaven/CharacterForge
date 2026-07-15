export type AlignmentId =
  | 'lawful-good'
  | 'neutral-good'
  | 'chaotic-good'
  | 'lawful-neutral'
  | 'true-neutral'
  | 'chaotic-neutral'
  | 'lawful-evil'
  | 'neutral-evil'
  | 'chaotic-evil'

export const ALIGNMENT_IDS = [
  'lawful-good',
  'neutral-good',
  'chaotic-good',
  'lawful-neutral',
  'true-neutral',
  'chaotic-neutral',
  'lawful-evil',
  'neutral-evil',
  'chaotic-evil',
] as const satisfies readonly AlignmentId[]

export const ALIGNMENT_LABELS: Record<AlignmentId, string> = {
  'lawful-good': 'Lawful Good',
  'neutral-good': 'Neutral Good',
  'chaotic-good': 'Chaotic Good',
  'lawful-neutral': 'Lawful Neutral',
  'true-neutral': 'True Neutral',
  'chaotic-neutral': 'Chaotic Neutral',
  'lawful-evil': 'Lawful Evil',
  'neutral-evil': 'Neutral Evil',
  'chaotic-evil': 'Chaotic Evil',
}

export function isAlignmentId(value: unknown): value is AlignmentId {
  return (
    typeof value === 'string' &&
    (ALIGNMENT_IDS as readonly string[]).includes(value)
  )
}

export function getAlignmentLabel(alignmentId: AlignmentId): string {
  return ALIGNMENT_LABELS[alignmentId]
}
