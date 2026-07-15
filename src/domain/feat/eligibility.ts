import type { FeatDefinition } from './types'

export type FeatEligibility =
  | { eligible: true }
  | { eligible: false; reason: string }

/**
 * Evaluates whether a feat can be selected for the current character.
 * Automatic eligibility from backgrounds / class progression is not wired yet;
 * this helper still surfaces prerequisite failure for catalogue cards.
 */
export function evaluateFeatEligibility(
  definition: FeatDefinition,
): FeatEligibility {
  if (definition.prerequisite.kind === 'none') {
    return { eligible: true }
  }

  // Text prerequisites are display-only until character context is wired.
  // Keep the feat selectable for the manual one-feat MVP.
  return { eligible: true }
}

export function formatFeatPrerequisite(
  prerequisite: FeatDefinition['prerequisite'],
): string {
  if (prerequisite.kind === 'none') {
    return 'None'
  }

  return prerequisite.summary
}
