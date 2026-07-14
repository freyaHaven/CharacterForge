import type { ClassChoice } from '../../domain/class/types'

export function findSingleSelectChoiceForFeature(
  featureId: string,
  choices: readonly ClassChoice[],
): Extract<ClassChoice, { type: 'single-select' }> | null {
  const choice = choices.find(
    (entry) => entry.id === featureId && entry.type === 'single-select',
  )

  return choice?.type === 'single-select' ? choice : null
}

export function getChoicesNotLinkedToFeatures(
  choices: readonly ClassChoice[],
  featureIds: readonly string[],
): ClassChoice[] {
  const featureIdSet = new Set(featureIds)

  return choices.filter(
    (choice) =>
      choice.type !== 'single-select' || !featureIdSet.has(choice.id),
  )
}
