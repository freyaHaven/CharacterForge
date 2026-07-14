import { useEffect, useRef, useState } from 'react'
import type { GeneratedAbilityScoreResult } from '../../rules/rolled'
import {
  formatGeneratedRollAriaLabel,
  formatGeneratedRollText,
} from './formatRollResult'
import { RolledDiceFace } from './RolledDiceFace'
import type { RollPresentationSequence } from './rollPresentation'

type RolledDiceAnimationProps = {
  result: GeneratedAbilityScoreResult
  sequence: RollPresentationSequence
  instant: boolean
  onComplete: () => void
}

export function RolledDiceAnimation({
  result,
  sequence,
  instant,
  onComplete,
}: RolledDiceAnimationProps) {
  const [revealedDice, setRevealedDice] = useState<Set<number>>(
    () => new Set(instant ? result.dice.map((die) => die.index) : []),
  )
  const [droppedDice, setDroppedDice] = useState<Set<number>>(
    () =>
      new Set(
        instant
          ? result.dice.filter((die) => die.dropped).map((die) => die.index)
          : [],
      ),
  )
  const [showTotal, setShowTotal] = useState(instant)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    completedRef.current = false
    setRevealedDice(new Set(instant ? result.dice.map((die) => die.index) : []))
    setDroppedDice(
      new Set(
        instant
          ? result.dice.filter((die) => die.dropped).map((die) => die.index)
          : [],
      ),
    )
    setShowTotal(instant)

    if (instant) {
      if (!completedRef.current) {
        completedRef.current = true
        onCompleteRef.current()
      }
      return
    }

    const timeouts: ReturnType<typeof setTimeout>[] = []
    let elapsed = 0

    for (const event of sequence.events) {
      elapsed += event.delayMs
      const timeout = setTimeout(() => {
        if (event.phase === 'reveal-die' && event.dieIndex !== undefined) {
          setRevealedDice((current) => new Set([...current, event.dieIndex!]))
        }

        if (event.phase === 'mark-dropped' && event.droppedDieIndices) {
          setDroppedDice(new Set(event.droppedDieIndices))
        }

        if (event.phase === 'show-total') {
          setShowTotal(true)
          if (!completedRef.current) {
            completedRef.current = true
            onCompleteRef.current()
          }
        }
      }, elapsed)
      timeouts.push(timeout)
    }

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout)
      }
    }
  }, [instant, result, sequence])

  return (
    <div className="rolled-animation">
      <div className="rolled-animation__dice" aria-hidden="true">
        {result.dice.map((die) => (
          <RolledDiceFace
            key={die.index}
            value={die.value}
            revealed={revealedDice.has(die.index)}
            dropped={droppedDice.has(die.index)}
            ariaLabel={
              droppedDice.has(die.index)
                ? `Die ${die.index + 1}: ${die.value}, dropped`
                : `Die ${die.index + 1}: ${die.value}`
            }
          />
        ))}
      </div>
      <p className="rolled-animation__text" aria-live="polite">
        {showTotal
          ? formatGeneratedRollText(result)
          : 'Rolling ability score...'}
      </p>
      <p className="sr-only" aria-live="polite">
        {showTotal ? formatGeneratedRollAriaLabel(result) : 'Rolling ability score.'}
      </p>
    </div>
  )
}
