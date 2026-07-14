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
    .map((die) =>
      die.dropped
        ? `Die ${die.index + 1}: ${die.value}, dropped`
        : `Die ${die.index + 1}: ${die.value}`,
    )
    .join('; ')

  return `Rolled ${diceDescription}. Total ${result.total}.`
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
  const base = formatRolledResultText(result)

  if (duplicateIndex <= 1) {
    return base
  }

  return `${base} (result ${duplicateIndex})`
}
