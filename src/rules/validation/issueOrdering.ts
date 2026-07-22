/**
 * Deterministic ordering for character-creation validation issues.
 *
 * Wizard routing uses step order via {@link getFirstIncompleteCharacterStep}.
 * Within a step (or aggregated summaries), sort issues with this priority so
 * object/content registration order never controls presentation.
 */

export type ValidationIssuePriorityBand =
  | 'structural'
  | 'inactive'
  | 'prerequisite'
  | 'missing-top-level'
  | 'missing-nested'
  | 'duplicate-or-exclusive'
  | 'spell-selection'
  | 'equipment'
  | 'derived'
  | 'informational'

const BAND_ORDER: readonly ValidationIssuePriorityBand[] = [
  'structural',
  'inactive',
  'prerequisite',
  'missing-top-level',
  'missing-nested',
  'duplicate-or-exclusive',
  'spell-selection',
  'equipment',
  'derived',
  'informational',
]

/** Map known issue codes to priority bands. Unknown codes sort last within informational. */
export const VALIDATION_ISSUE_CODE_BAND: Readonly<
  Record<string, ValidationIssuePriorityBand>
> = {
  'class-not-found': 'structural',
  'wrong-edition': 'structural',
  'invalid-level': 'structural',
  'duplicate-instance-id': 'structural',
  'invalid-starting-class-reference': 'structural',
  'allocation-exceeds-target': 'structural',
  malformed: 'structural',

  'inactive-source-state': 'inactive',
  'unknown-choice': 'inactive',
  'unknown-option': 'inactive',
  'stale-selection': 'inactive',

  'multiclass-ability-prerequisite': 'prerequisite',
  'prerequisite-failed': 'prerequisite',
  'feat-prerequisite-failed': 'prerequisite',

  'missing-required-choice': 'missing-top-level',
  'under-limit': 'missing-top-level',
  'missing-source-state': 'missing-top-level',
  incomplete: 'missing-top-level',
  'incomplete-choice': 'missing-top-level',

  'missing-nested-choice': 'missing-nested',
  'nested-choice-incomplete': 'missing-nested',

  'duplicate-selection': 'duplicate-or-exclusive',
  'duplicate-class-id': 'duplicate-or-exclusive',
  'cross-source-duplicate': 'duplicate-or-exclusive',
  'granted-spell-selected': 'duplicate-or-exclusive',
  'feat-already-taken': 'duplicate-or-exclusive',
  'over-limit': 'duplicate-or-exclusive',
  'invalid-multi-select-count': 'duplicate-or-exclusive',

  'spell-not-found': 'spell-selection',
  'spell-not-on-list': 'spell-selection',
  'spell-level-ineligible': 'spell-selection',
  'spell-school-ineligible': 'spell-selection',
  'spell-casting-time-ineligible': 'spell-selection',
  'spell-ritual-ineligible': 'spell-selection',
  'not-in-spellbook': 'spell-selection',
  'invalid-choice': 'spell-selection',

  'equipment-incomplete': 'equipment',
  'unknown-item': 'equipment',
  'invalid-equipment-selection': 'equipment',

  'derived-blocked': 'derived',

  'soft-invalid': 'informational',
  warning: 'informational',
}

export function validationIssueBand(
  code: string,
): ValidationIssuePriorityBand {
  return VALIDATION_ISSUE_CODE_BAND[code] ?? 'informational'
}

export type OrderableValidationIssue = {
  code: string
  sourceKey?: string
  entitlementId?: string
  choiceId?: string
  spellId?: string
  message?: string
}

/**
 * Stable comparator: band → code → sourceKey → entitlement/choice → spellId → message.
 */
export function compareValidationIssues(
  left: OrderableValidationIssue,
  right: OrderableValidationIssue,
): number {
  const leftBand = BAND_ORDER.indexOf(validationIssueBand(left.code))
  const rightBand = BAND_ORDER.indexOf(validationIssueBand(right.code))
  if (leftBand !== rightBand) {
    return leftBand - rightBand
  }

  const codeCmp = left.code.localeCompare(right.code)
  if (codeCmp !== 0) {
    return codeCmp
  }

  const sourceCmp = (left.sourceKey ?? '').localeCompare(right.sourceKey ?? '')
  if (sourceCmp !== 0) {
    return sourceCmp
  }

  const pathCmp = (left.entitlementId ?? left.choiceId ?? '').localeCompare(
    right.entitlementId ?? right.choiceId ?? '',
  )
  if (pathCmp !== 0) {
    return pathCmp
  }

  const spellCmp = (left.spellId ?? '').localeCompare(right.spellId ?? '')
  if (spellCmp !== 0) {
    return spellCmp
  }

  return (left.message ?? '').localeCompare(right.message ?? '')
}

export function sortValidationIssues<T extends OrderableValidationIssue>(
  issues: readonly T[],
): T[] {
  return [...issues].sort(compareValidationIssues)
}
