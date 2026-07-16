import type {
  AbilityScoreResult,
  GeneratedAbilityScoreResult,
} from '../../rules/rolled'
import { getDroppedDice } from '../../rules/rolled'

export function formatGeneratedRollText(
  result: GeneratedAbilityScoreResult,
): string {
  const diceValues = result.dice.map((die) => die.value).join(', ')
  const droppedValues = getDroppedDice(result)
    .map((die) => die.value)
    .join(', ')
  const modifierSuffix =
    result.modifiers.length > 0
      ? ` + ${result.modifiers.map((modifier) => modifier.value).join(' + ')}`
      : ''

  return `${diceValues} — drop ${droppedValues}${modifierSuffix} — total ${result.total}`
}

export function formatGeneratedRollAriaLabel(
  result: GeneratedAbilityScoreResult,
): string {
  const diceDescription = result.dice
    .map((die) => `${die.value} ${die.dropped ? 'discarded' : 'kept'}`)
    .join(', ')

  return `Roll total: ${result.total}. Dice: ${diceDescription}`
}

export function formatManualRollText(total: number): string {
  return `Manual result: ${total}`
}

export function formatRolledResultText(result: AbilityScoreResult): string {
  if (result.kind === 'manual') {
    return formatManualRollText(result.total)
  }

  return formatGeneratedRollText(result)
}

export function formatRolledResultAriaLabel(result: AbilityScoreResult): string {
  if (result.kind === 'manual') {
    return `Manual result: ${result.total}.`
  }

  return formatGeneratedRollAriaLabel(result)
}

export function formatRolledResultOptionLabel(
  result: AbilityScoreResult,
  duplicateIndex: number,
): string {
  const base = String(result.total)

  if (duplicateIndex <= 1) {
    return base
  }

  return `${base} (result ${duplicateIndex})`
}
