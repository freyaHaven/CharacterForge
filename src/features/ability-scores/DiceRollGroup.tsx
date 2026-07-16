import type { AbilityScoreResult, GeneratedAbilityScoreResult } from '../../rules/rolled'
import { formatManualRollText } from './formatRollResult'

export type DiceRollGroupProps = {
  result: AbilityScoreResult
  title?: string
}

function formatGeneratedDiceAriaLabel(
  result: GeneratedAbilityScoreResult,
): string {
  const diceDescription = result.dice
    .map((die) => `${die.value} ${die.dropped ? 'discarded' : 'kept'}`)
    .join(', ')

  return `Roll total: ${result.total}. Dice: ${diceDescription}`
}

function GeneratedDiceRollGroup({
  result,
  title,
}: {
  result: GeneratedAbilityScoreResult
  title?: string
}) {
  const accessibleLabel = [
    title,
    formatGeneratedDiceAriaLabel(result),
  ]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join('. ')

  return (
    <article className="dice-roll-group" aria-label={accessibleLabel}>
      {title !== undefined ? (
        <p className="dice-roll-group__title">{title}</p>
      ) : null}
      <p className="dice-roll-group__total" aria-label={`Roll total: ${result.total}`}>
        {result.total}
      </p>
      <ul className="dice-roll-group__dice">
        {result.dice.map((die) => (
          <li
            key={die.index}
            className={
              die.dropped
                ? 'dice-roll-group__die dice-roll-group__die--discarded'
                : 'dice-roll-group__die dice-roll-group__die--kept'
            }
            aria-label={
              die.dropped
                ? `Discarded die ${die.value}`
                : `Kept die ${die.value}`
            }
          >
            <span aria-hidden="true">{die.value}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function DiceRollGroup({ result, title }: DiceRollGroupProps) {
  if (result.kind === 'manual') {
    return (
      <article
        className="dice-roll-group dice-roll-group--manual"
        aria-label={title ?? formatManualRollText(result.total)}
      >
        {title !== undefined ? (
          <p className="dice-roll-group__title">{title}</p>
        ) : null}
        <p
          className="dice-roll-group__total"
          aria-label={`Roll total: ${result.total}`}
        >
          {result.total}
        </p>
        <p className="dice-roll-group__manual-note">Manual result</p>
      </article>
    )
  }

  return <GeneratedDiceRollGroup result={result} title={title} />
}
