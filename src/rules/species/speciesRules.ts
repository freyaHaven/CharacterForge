import type {
  SpeciesDefinition,
  SpeciesEffect,
  SpeciesSelection,
  SpeciesSelectionChoiceValue,
} from '../../domain/species/types'
import type { EditionId } from '../../domain/types'
import { resolveLanguageChoicePool } from '../../domain/species/standardLanguages'
import { resolveSpeciesEffects } from './resolveSpeciesEffects'

export type SpeciesValidationIssueCode =
  | 'species-not-found'
  | 'wrong-edition'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'unknown-choice'

export type SpeciesValidationIssue = {
  code: SpeciesValidationIssueCode
  choiceId?: string
}

export type SpeciesValidationResult =
  | { ok: true }
  | { ok: false; issues: SpeciesValidationIssue[] }

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
