import type { ClassSelection } from '../../domain/class/types'
import type { ClassValidationResult } from '../../rules/class/classRules'
import type { ClassSelectionDraft } from './classSelectionDraft'

export function formatClassCompletionStatus({
  committedSelection,
  draft,
  draftValidation,
}: {
  committedSelection: ClassSelection | null
  draft: ClassSelectionDraft | null
  draftValidation: ClassValidationResult | null
}): string {
  if (committedSelection !== null && draft === null) {
    return 'Class selection complete'
  }

  if (draft !== null) {
    if (draftValidation?.ok === false) {
      return 'Complete required choices to confirm'
    }

    return 'Complete required choices to confirm'
  }

  return 'Not selected'
}
