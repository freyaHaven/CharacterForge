import type {
  AbilityScoreIncreaseSelection,
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import type { EditionId } from '../../domain/types'
import { validateBackgroundSelection } from '../../rules/background/backgroundRules'
import type { BackgroundValidationResult } from '../../rules/background/backgroundRules'

export type BackgroundSelectionDraft = {
  backgroundId: string
  abilityScoreIncrease: AbilityScoreIncreaseSelection | null
  choices: Record<string, string>
}

export function createBackgroundSelectionDraft(
  backgroundId: string,
): BackgroundSelectionDraft {
  return {
    backgroundId,
    abilityScoreIncrease: null,
    choices: {},
  }
}

export function initializeBackgroundSelectionDraft(
  selection: BackgroundSelection,
): BackgroundSelectionDraft {
  return {
    backgroundId: selection.backgroundId,
    abilityScoreIncrease: selection.abilityScoreIncrease,
    choices: { ...selection.choices },
  }
}

export function draftToBackgroundSelection(
  draft: BackgroundSelectionDraft,
): BackgroundSelection {
  if (draft.abilityScoreIncrease === null) {
    return {
      backgroundId: draft.backgroundId,
      abilityScoreIncrease: { mode: 'three-one' },
      choices: { ...draft.choices },
    }
  }

  return {
    backgroundId: draft.backgroundId,
    abilityScoreIncrease: draft.abilityScoreIncrease,
    choices: { ...draft.choices },
  }
}

export function updateBackgroundDraftChoice(
  draft: BackgroundSelectionDraft,
  choiceId: string,
  optionId: string | undefined,
): BackgroundSelectionDraft {
  const nextChoices = { ...draft.choices }

  if (optionId === undefined) {
    delete nextChoices[choiceId]
  } else {
    nextChoices[choiceId] = optionId
  }

  return {
    ...draft,
    choices: nextChoices,
  }
}

export function updateBackgroundDraftAbilityScoreIncrease(
  draft: BackgroundSelectionDraft,
  increase: AbilityScoreIncreaseSelection | null,
): BackgroundSelectionDraft {
  return {
    ...draft,
    abilityScoreIncrease: increase,
  }
}

export function validateBackgroundDraft(
  draft: BackgroundSelectionDraft,
  editionId: EditionId,
  definition: BackgroundDefinition | null,
): BackgroundValidationResult {
  if (definition === null) {
    return { ok: false, issues: [{ code: 'background-not-found' }] }
  }

  if (draft.abilityScoreIncrease === null) {
    return {
      ok: false,
      issues: [{ code: 'missing-ability-score-increase' }],
    }
  }

  return validateBackgroundSelection(
    draftToBackgroundSelection(draft),
    editionId,
    definition,
  )
}

export function tryCommitBackgroundDraft(
  draft: BackgroundSelectionDraft,
  editionId: EditionId,
  definition: BackgroundDefinition | null,
): {
  committed: BackgroundSelection | null
  validation: BackgroundValidationResult
} {
  if (definition === null) {
    return {
      committed: null,
      validation: { ok: false, issues: [{ code: 'background-not-found' }] },
    }
  }

  if (draft.abilityScoreIncrease === null) {
    return {
      committed: null,
      validation: {
        ok: false,
        issues: [{ code: 'missing-ability-score-increase' }],
      },
    }
  }

  const selection = draftToBackgroundSelection(draft)
  const validation = validateBackgroundSelection(
    selection,
    editionId,
    definition,
  )

  if (!validation.ok) {
    return { committed: null, validation }
  }

  return { committed: selection, validation }
}

export function isBackgroundDraftIncomplete(
  draft: BackgroundSelectionDraft | null,
  committedSelection: BackgroundSelection | null,
): boolean {
  return draft !== null && committedSelection === null
}
