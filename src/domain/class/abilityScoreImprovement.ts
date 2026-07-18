import { ABILITY_IDS, isAbilityId, type AbilityId } from '../abilities/types'
import type { FeatDefinition } from '../feat/types'
import type { FeatEligibility } from '../feat/eligibility'
import { evaluateFeatEligibility } from '../feat/eligibility'
import { ABILITY_ABBREVIATIONS } from '../character/sheetMechanics'

export const ASI_MODES = ['plus-2', 'plus-1-1', 'feat'] as const

export type AsiMode = (typeof ASI_MODES)[number]

export type AsiChoiceValue =
  | { kind: 'mode'; mode: AsiMode }
  | { kind: 'plus-2'; abilityId: AbilityId }
  | { kind: 'plus-1-1'; abilityIds: [AbilityId, AbilityId] }
  | { kind: 'feat'; featId: string }

export const ASI_CHOICE_OPTIONS = [
  {
    id: 'plus-2',
    label: 'Increase one Ability Score by 2',
  },
  {
    id: 'plus-1-1',
    label: 'Increase two Ability Scores by 1',
  },
  {
    id: 'feat',
    label: 'Choose a Feat',
  },
] as const

export function isAbilityScoreImprovementChoiceId(choiceId: string): boolean {
  return (
    choiceId.startsWith('ability-score-improvement-') ||
    choiceId.startsWith('epic-boon-')
  )
}

export function isAsiMode(value: string): value is AsiMode {
  return (ASI_MODES as readonly string[]).includes(value)
}

/** Serialize a parsed ASI value to the ClassChoiceValue string form. */
export function serializeAsiChoice(value: AsiChoiceValue): string {
  switch (value.kind) {
    case 'mode':
      return value.mode
    case 'plus-2':
      return `plus-2:${value.abilityId}`
    case 'plus-1-1':
      return `plus-1-1:${value.abilityIds[0]},${value.abilityIds[1]}`
    case 'feat':
      return `feat:${value.featId}`
  }
}

/**
 * Parse an ASI encoded string.
 * Returns null for malformed encodings (not bare incomplete modes).
 */
export function parseAsiChoice(value: string): AsiChoiceValue | null {
  if (isAsiMode(value)) {
    return { kind: 'mode', mode: value }
  }

  if (value.startsWith('plus-2:')) {
    const abilityId = value.slice('plus-2:'.length)
    if (!isAbilityId(abilityId) || abilityId.includes(',') || abilityId.includes(':')) {
      return null
    }

    return { kind: 'plus-2', abilityId }
  }

  if (value.startsWith('plus-1-1:')) {
    const detail = value.slice('plus-1-1:'.length)
    const parts = detail.split(',')
    if (parts.length !== 2) {
      return null
    }

    const [first, second] = parts
    if (
      first === undefined ||
      second === undefined ||
      !isAbilityId(first) ||
      !isAbilityId(second) ||
      first === second
    ) {
      return null
    }

    return { kind: 'plus-1-1', abilityIds: [first, second] }
  }

  if (value.startsWith('feat:')) {
    const featId = value.slice('feat:'.length)
    if (featId.length === 0 || featId.includes(',')) {
      return null
    }

    return { kind: 'feat', featId }
  }

  return null
}

export function isCompleteAsiChoiceValue(
  value: string | undefined,
): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }

  const parsed = parseAsiChoice(value)
  if (parsed === null || parsed.kind === 'mode') {
    return false
  }

  return true
}

export function getAsiMode(value: string | undefined): AsiMode | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const parsed = parseAsiChoice(value)
  if (parsed === null) {
    return null
  }

  if (parsed.kind === 'mode') {
    return parsed.mode
  }

  return parsed.kind === 'plus-1-1' ? 'plus-1-1' : parsed.kind
}

/** Switch mode and clear any previous mode detail. */
export function selectAsiMode(mode: AsiMode): string {
  return serializeAsiChoice({ kind: 'mode', mode })
}

export function selectAsiPlus2(abilityId: AbilityId): string {
  return serializeAsiChoice({ kind: 'plus-2', abilityId })
}

export function selectAsiPlus1Plus1(
  first: AbilityId,
  second: AbilityId,
): string {
  return serializeAsiChoice({
    kind: 'plus-1-1',
    abilityIds: [first, second],
  })
}

export function selectAsiFeat(featId: string): string {
  return serializeAsiChoice({ kind: 'feat', featId })
}

export function collectAsiFeatIds(
  choices: Record<string, string | string[] | undefined>,
  exceptChoiceId?: string,
): string[] {
  const featIds: string[] = []

  for (const [choiceId, value] of Object.entries(choices)) {
    if (
      !isAbilityScoreImprovementChoiceId(choiceId) ||
      choiceId === exceptChoiceId ||
      typeof value !== 'string'
    ) {
      continue
    }

    const parsed = parseAsiChoice(value)
    if (parsed?.kind === 'feat') {
      featIds.push(parsed.featId)
    }
  }

  return featIds
}

export type AsiValidationResult =
  | { ok: true; complete: boolean }
  | { ok: false; reason: 'missing' | 'incomplete' | 'invalid' }

export type AsiFeatValidationContext = {
  featById: ReadonlyMap<string, FeatDefinition>
  /** Feat ids already taken outside this choice (other ASI slots, character.feat, etc.). */
  takenFeatIds: readonly string[]
  evaluateEligibility?: (definition: FeatDefinition) => FeatEligibility
}

export function validateAsiEncodedValue(
  value: string | undefined,
  featContext?: AsiFeatValidationContext,
): AsiValidationResult {
  if (value === undefined || value.length === 0) {
    return { ok: false, reason: 'missing' }
  }

  const parsed = parseAsiChoice(value)
  if (parsed === null) {
    return { ok: false, reason: 'invalid' }
  }

  if (parsed.kind === 'mode') {
    return { ok: false, reason: 'incomplete' }
  }

  if (parsed.kind === 'plus-2' || parsed.kind === 'plus-1-1') {
    return { ok: true, complete: true }
  }

  if (featContext === undefined) {
    // Structural completeness without catalog — feat id present and well-formed.
    return { ok: true, complete: true }
  }

  const definition = featContext.featById.get(parsed.featId)
  if (definition === undefined) {
    return { ok: false, reason: 'invalid' }
  }

  const evaluate =
    featContext.evaluateEligibility ?? evaluateFeatEligibility
  if (!evaluate(definition).eligible) {
    return { ok: false, reason: 'invalid' }
  }

  const priorTakes = featContext.takenFeatIds.filter(
    (featId) => featId === parsed.featId,
  ).length

  if (priorTakes > 0 && !definition.repeatable) {
    return { ok: false, reason: 'invalid' }
  }

  return { ok: true, complete: true }
}

export function formatAsiChoiceSummary(
  value: string,
  featNameById?: ReadonlyMap<string, string>,
): string | null {
  const parsed = parseAsiChoice(value)
  if (parsed === null || parsed.kind === 'mode') {
    return null
  }

  if (parsed.kind === 'plus-2') {
    return `${ABILITY_ABBREVIATIONS[parsed.abilityId]} +2`
  }

  if (parsed.kind === 'plus-1-1') {
    return `${ABILITY_ABBREVIATIONS[parsed.abilityIds[0]]} +1, ${ABILITY_ABBREVIATIONS[parsed.abilityIds[1]]} +1`
  }

  const featName = featNameById?.get(parsed.featId) ?? parsed.featId
  return `Feat: ${featName}`
}

export function createAsiChoiceDefinition(
  id: string,
  level: number,
): {
  id: string
  level: number
  prompt: string
  type: 'single-select'
  required: true
  options: { id: string; label: string }[]
} {
  return {
    id,
    level,
    prompt: 'Ability Score Improvement',
    type: 'single-select',
    required: true,
    options: ASI_CHOICE_OPTIONS.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  }
}

export const ASI_FEATURE_LEVELS = [4, 6, 8, 12, 14, 16] as const

export const BARBARIAN_ASI_FEATURE_LEVELS = [4, 8, 12, 16] as const

export const MONK_ASI_FEATURE_LEVELS = [4, 8, 12, 16] as const

export const PALADIN_ASI_FEATURE_LEVELS = [4, 8, 12, 16] as const

export const ROGUE_ASI_FEATURE_LEVELS = [4, 8, 10, 12, 16] as const

export const RANGER_ASI_FEATURE_LEVELS = [4, 8, 12, 16] as const

/** Deterministic complete ASI picks for tests and fixtures. */
export function createAsiChoicesUpToLevel(
  level: number,
  asiLevels: readonly number[] = ASI_FEATURE_LEVELS,
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const asiLevel of asiLevels) {
    if (level >= asiLevel) {
      result[`ability-score-improvement-${asiLevel}`] = selectAsiPlus2('strength')
    }
  }

  return result
}

export const ALL_ABILITY_OPTIONS: readonly AbilityId[] = ABILITY_IDS
