export function createClassChoiceStateKey(
  instanceId: string,
  choiceId: string,
): string {
  return `${instanceId}:${choiceId}`
}

export function createClassFeatureStateKey(
  instanceId: string,
  featureId: string,
): string {
  return `${instanceId}:feature:${featureId}`
}

export function createDeferredRequirementKey(
  sourceInstanceId: string,
  requirementId: string,
): string {
  return `${sourceInstanceId}:${requirementId}`
}
