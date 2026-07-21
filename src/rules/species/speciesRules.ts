import type { FeatDefinition } from '../../domain/feat/types'
import type {
  SpeciesDefinition,
  SpeciesEffect,
  SpeciesSelection,
  SpeciesSelectionChoiceValue,
} from '../../domain/species/types'
import type { EditionId } from '../../domain/types'
import { resolveLanguageChoicePool } from '../../domain/species/standardLanguages'
import { evaluateFeatEligibility } from '../../domain/feat/eligibility'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import { resolveSpeciesEffects } from './resolveSpeciesEffects'

export type SpeciesValidationIssueCode =
  | 'species-not-found'
  | 'wrong-edition'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'unknown-choice'
  | 'duplicate-feat'

export type SpeciesValidationIssue = {
  code: SpeciesValidationIssueCode
  choiceId?: string
}

export type SpeciesValidationResult =
  | { ok: true }
  | { ok: false; issues: SpeciesValidationIssue[] }

export type SpeciesValidationOptions = {
  featById?: ReadonlyMap<string, FeatDefinition>
  /** Feat ids already granted outside this species selection (background, class, legacy). */
  takenFeatIds?: readonly string[]
  eligibilityContext?: FeatEligibilityContext
}

function getSelectedIds(
  value: SpeciesSelectionChoiceValue | undefined,
): string[] {
  if (value === undefined) {
    return []
  }

  return typeof value === 'string' ? [value] : value
}

function isKnownChoiceId(
  definition: SpeciesDefinition,
  choiceId: string,
): boolean {
  return (
    definition.choices.some((choice) => choice.id === choiceId) ||
    definition.languages.choices.some((choice) => choice.id === choiceId)
  )
}

export function validateSpeciesSelection(
  selection: SpeciesSelection,
  editionId: EditionId,
  definition: SpeciesDefinition | null,
  options?: SpeciesValidationOptions,
): SpeciesValidationResult {
  if (definition === null) {
    return { ok: false, issues: [{ code: 'species-not-found' }] }
  }

  if (definition.editionId !== editionId) {
    return { ok: false, issues: [{ code: 'wrong-edition' }] }
  }

  const issues: SpeciesValidationIssue[] = []

  for (const choice of definition.choices) {
    const selectedValue = selection.choices[choice.id]

    if (choice.required && selectedValue === undefined) {
      issues.push({ code: 'missing-required-choice', choiceId: choice.id })
      continue
    }

    if (selectedValue === undefined) {
      continue
    }

    if (typeof selectedValue !== 'string') {
      issues.push({ code: 'invalid-choice', choiceId: choice.id })
      continue
    }

    if (choice.type === 'feat-grant') {
      const feat = options?.featById?.get(selectedValue)
      if (feat === undefined) {
        issues.push({ code: 'invalid-choice', choiceId: choice.id })
        continue
      }

      if (
        choice.featCategory !== undefined &&
        feat.category !== choice.featCategory
      ) {
        issues.push({ code: 'invalid-choice', choiceId: choice.id })
        continue
      }

      if (options?.takenFeatIds?.includes(feat.id) && !feat.repeatable) {
        issues.push({ code: 'duplicate-feat', choiceId: choice.id })
        continue
      }

      if (options?.eligibilityContext !== undefined) {
        const eligibility = evaluateFeatEligibility(feat, {
          ...options.eligibilityContext,
          takenFeatIds: options.takenFeatIds ?? [],
        })
        if (!eligibility.eligible) {
          issues.push({ code: 'invalid-choice', choiceId: choice.id })
        }
      }

      continue
    }

    const isValidOption = choice.options.some(
      (option) => option.id === selectedValue,
    )

    if (!isValidOption) {
      issues.push({ code: 'invalid-choice', choiceId: choice.id })
    }
  }

  for (const languageChoice of definition.languages.choices) {
    const selectedIds = getSelectedIds(selection.choices[languageChoice.id])

    if (languageChoice.required && selectedIds.length < languageChoice.count) {
      issues.push({
        code: 'missing-required-choice',
        choiceId: languageChoice.id,
      })
      continue
    }

    if (selectedIds.length === 0) {
      continue
    }

    if (selectedIds.length > languageChoice.count) {
      issues.push({ code: 'invalid-choice', choiceId: languageChoice.id })
      continue
    }

    const pool = resolveLanguageChoicePool(languageChoice.pool)
    const hasInvalidOption = selectedIds.some(
      (optionId) => !pool.some((option) => option.id === optionId),
    )
    const hasDuplicates = new Set(selectedIds).size !== selectedIds.length

    if (hasInvalidOption || hasDuplicates) {
      issues.push({ code: 'invalid-choice', choiceId: languageChoice.id })
    }
  }

  for (const choiceId of Object.keys(selection.choices)) {
    if (!isKnownChoiceId(definition, choiceId)) {
      issues.push({ code: 'unknown-choice', choiceId })
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true }
}

export type ResolvedSpecies = {
  definition: SpeciesDefinition
  selection: SpeciesSelection
  effects: SpeciesEffect[]
}

export async function resolveSpecies(
  selection: SpeciesSelection,
  getDefinition: (speciesId: string) => Promise<SpeciesDefinition | null>,
): Promise<ResolvedSpecies | null> {
  const definition = await getDefinition(selection.speciesId)

  if (definition === null) {
    return null
  }

  return {
    definition,
    selection,
    effects: resolveSpeciesEffects(definition, selection),
  }
}

export async function needsEditionChangeSpeciesConfirmation(
  selection: SpeciesSelection | null,
  nextEditionId: EditionId,
  getDefinition: (speciesId: string) => Promise<SpeciesDefinition | null>,
): Promise<boolean> {
  if (selection === null) {
    return false
  }

  const definition = await getDefinition(selection.speciesId)

  if (definition === null) {
    return true
  }

  return definition.editionId !== nextEditionId
}
