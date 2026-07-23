import { THRESHOLD_COLLAPSE_DEFAULT } from '../choices/ThresholdCollapseList'

export type SpellSectionCollapseKind = 'selectable' | 'granted'

export type SpellSectionCollapseInput = {
  kind: SpellSectionCollapseKind
  itemCount: number
  threshold?: number
  /**
   * Selectable progress toward the entitlement or group pick limit.
   * Ignored for granted sections.
   */
  selectedCount?: number
  /** Pick capacity (entitlement or group). Null when unknown / informational. */
  capacity?: number | null
  /** Force open when the section contains invalid selections. */
  hasValidationError?: boolean
}

/**
 * Whether a spell section should accordion (vs render inline).
 */
export function shouldCollapseSpellSection(
  itemCount: number,
  threshold: number = THRESHOLD_COLLAPSE_DEFAULT,
): boolean {
  return itemCount > threshold
}

/**
 * Default expanded state when a section collapses into an accordion.
 *
 * - Granted: always collapsed
 * - Selectable: expanded when incomplete or invalid; collapsed when complete
 */
export function resolveSpellSectionDefaultExpanded(
  input: SpellSectionCollapseInput,
): boolean {
  if (input.kind === 'granted') {
    return false
  }

  if (input.hasValidationError === true) {
    return true
  }

  const capacity = input.capacity
  if (capacity === null || capacity === undefined || capacity <= 0) {
    return true
  }

  const selected = input.selectedCount ?? 0
  return selected < capacity
}

/** Accordion / inline header: "Cantrips · 0/4". */
export function formatSpellSectionTitle(
  label: string,
  progress: string,
): string {
  return `${label} · ${progress}`
}

export function formatSelectionProgress(
  selected: number,
  limit: number,
): string {
  return `${selected}/${limit}`
}
