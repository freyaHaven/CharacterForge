import type {
  SpeciesDefinition,
  SpeciesEffect,
  SpeciesSelection,
} from '../../domain/species/types'
import type { EditionId } from '../../domain/types'
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
    const selectedOptionId = selection.choices[choice.id]

    if (choice.required && selectedOptionId === undefined) {
      issues.push({ code: 'missing-required-choice', choiceId: choice.id })
      continue
    }

    if (selectedOptionId === undefined) {
      continue
    }

    const isValidOption = choice.options.some(
      (option) => option.id === selectedOptionId,
    )

    if (!isValidOption) {
      issues.push({ code: 'invalid-choice', choiceId: choice.id })
    }
  }

  for (const choiceId of Object.keys(selection.choices)) {
    const isKnownChoice = definition.choices.some(
      (choice) => choice.id === choiceId,
    )

    if (!isKnownChoice) {
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
