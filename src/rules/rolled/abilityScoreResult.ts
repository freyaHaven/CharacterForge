export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

export type RolledDie = {
  readonly index: number
  readonly value: DieValue
  readonly dropped: boolean
}

export type RollModifier = {
  readonly kind: 'flat'
  readonly value: number
}

export type GeneratedAbilityScoreResult = {
  readonly kind: 'generated'
  readonly formulaId: RollingFormulaId
  readonly dice: readonly RolledDie[]
  readonly modifiers: readonly RollModifier[]
  readonly total: number
}

export type ManualAbilityScoreResult = {
  readonly kind: 'manual'
  readonly total: number
}

export type AbilityScoreResult =
  | GeneratedAbilityScoreResult
  | ManualAbilityScoreResult

export type RollingFormulaId = '4d6-drop-lowest'

export function getKeptDice(
  result: GeneratedAbilityScoreResult,
): readonly DieValue[] {
  return result.dice.filter((die) => !die.dropped).map((die) => die.value)
}

export function getDroppedDice(
  result: GeneratedAbilityScoreResult,
): readonly RolledDie[] {
  return result.dice.filter((die) => die.dropped)
}

export function getModifierTotal(modifiers: readonly RollModifier[]): number {
  return modifiers.reduce((sum, modifier) => sum + modifier.value, 0)
}

export function computeGeneratedTotal(
  dice: readonly RolledDie[],
  modifiers: readonly RollModifier[],
): number {
  const keptTotal = dice
    .filter((die) => !die.dropped)
    .reduce((sum, die) => sum + die.value, 0)

  return keptTotal + getModifierTotal(modifiers)
}

export function getAbilityScoreResultTotal(result: AbilityScoreResult): number {
  return result.total
}
