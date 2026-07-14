export type FeatureChoiceExpansionState = Record<string, boolean | undefined>

export function getFeatureChoiceExpanded(
  state: FeatureChoiceExpansionState,
  choiceId: string,
  hasSelection: boolean,
): boolean {
  const stored = state[choiceId]

  if (stored !== undefined) {
    return stored
  }

  return !hasSelection
}

export function setFeatureChoiceExpanded(
  state: FeatureChoiceExpansionState,
  choiceId: string,
  expanded: boolean,
): FeatureChoiceExpansionState {
  return {
    ...state,
    [choiceId]: expanded,
  }
}

export function pruneFeatureChoiceExpansionState(
  state: FeatureChoiceExpansionState,
  availableChoiceIds: readonly string[],
): FeatureChoiceExpansionState {
  const available = new Set(availableChoiceIds)
  const next: FeatureChoiceExpansionState = {}

  for (const choiceId of available) {
    if (choiceId in state) {
      next[choiceId] = state[choiceId]
    }
  }

  return next
}
