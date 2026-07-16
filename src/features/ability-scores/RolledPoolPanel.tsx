import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ROLLING_FORMULA_ID,
  ROLLED_ABILITY_SCORE_COUNT,
  generateAbilityScorePool,
  getRollingFormula,
  type GeneratedAbilityScoreResult,
} from '../../rules/rolled'
import {
  createRolledDraftFromGeneratedResults,
  shouldConfirmReroll,
  type RolledDraft,
} from './rolledDraft'
import { formatRolledResultText } from './formatRollResult'
import { buildRollPresentationSequence } from './rollPresentation'
import { RolledDiceAnimation } from './RolledDiceAnimation'

type RolledPoolPanelProps = {
  draft: RolledDraft | null
  prefersReducedMotion: boolean
  randomSource: () => number
  onPoolReady: (draft: RolledDraft) => void
}

type PlaybackSession = {
  rolls: GeneratedAbilityScoreResult[]
  currentIndex: number
  completedResults: GeneratedAbilityScoreResult[]
  skipAll: boolean
  skipCurrent: boolean
}

export function RolledPoolPanel({
  draft,
  prefersReducedMotion,
  randomSource,
  onPoolReady,
}: RolledPoolPanelProps) {
  const [playback, setPlayback] = useState<PlaybackSession | null>(null)
  const skipAllRef = useRef(false)

  const formula = getRollingFormula(DEFAULT_ROLLING_FORMULA_ID)

  useEffect(() => {
    skipAllRef.current = false
  }, [playback?.currentIndex])

  function startPlayback(rolls: GeneratedAbilityScoreResult[]) {
    setPlayback({
      rolls,
      currentIndex: 0,
      completedResults: [],
      skipAll: prefersReducedMotion,
      skipCurrent: prefersReducedMotion,
    })
  }

  function handleRollDice() {
    if (
      draft !== null &&
      shouldConfirmReroll(draft.assignments) &&
      !window.confirm(
        'Rerolling will clear your current assignments. Continue?',
      )
    ) {
      return
    }

    const rolls = generateAbilityScorePool(
      ROLLED_ABILITY_SCORE_COUNT,
      DEFAULT_ROLLING_FORMULA_ID,
      randomSource,
    )
    startPlayback(rolls)
  }

  function handleSkipCurrent() {
    setPlayback((current) =>
      current === null
        ? current
        : {
            ...current,
            skipCurrent: true,
          },
    )
  }

  function handleSkipAll() {
    skipAllRef.current = true
    setPlayback((current) =>
      current === null
        ? current
        : {
            ...current,
            skipAll: true,
            skipCurrent: true,
          },
    )
  }

  function handleRollComplete() {
    setPlayback((current) => {
      if (current === null) {
        return current
      }

      const completedRoll = current.rolls[current.currentIndex]!
      const completedResults = [...current.completedResults, completedRoll]
      const nextIndex = current.currentIndex + 1
      const shouldFinish =
        nextIndex >= current.rolls.length ||
        current.skipAll ||
        skipAllRef.current

      if (shouldFinish) {
        const nextDraft = createRolledDraftFromGeneratedResults(current.rolls)
        queueMicrotask(() => {
          onPoolReady(nextDraft)
        })
        skipAllRef.current = false
        return null
      }

      return {
        ...current,
        completedResults,
        currentIndex: nextIndex,
        skipCurrent: false,
      }
    })
  }

  const currentRoll =
    playback === null ? null : playback.rolls[playback.currentIndex] ?? null
  const isAnimating = playback !== null && currentRoll !== null
  const instantPlayback =
    playback?.skipAll === true ||
    playback?.skipCurrent === true ||
    prefersReducedMotion

  return (
    <div className="rolled-panel">
      <p className="helper-text">
        {formula.label}. {formula.description}
      </p>

      <div className="rolled-panel__actions">
        <button type="button" onClick={handleRollDice} disabled={isAnimating}>
          Roll dice
        </button>
        {isAnimating ? (
          <>
            <button type="button" onClick={handleSkipCurrent}>
              Skip current animation
            </button>
            <button type="button" onClick={handleSkipAll}>
              Skip all animations
            </button>
          </>
        ) : null}
      </div>

      {playback !== null && playback.completedResults.length > 0 ? (
        <div className="rolled-pool-preview">
          <p className="rolled-pool-preview__title">Completed results</p>
          <ul>
            {playback.completedResults.map((result, index) => (
              <li key={`completed-${index}`}>{formatRolledResultText(result)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {draft !== null && playback === null ? (
        <div className="rolled-pool-preview">
          <p className="rolled-pool-preview__title">Rolled results</p>
          <ul>
            {draft.pool.map((entry) => (
              <li key={entry.id}>{formatRolledResultText(entry.result)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {isAnimating && currentRoll !== null ? (
        <RolledDiceAnimation
          key={`roll-${playback.currentIndex}-${instantPlayback}`}
          result={currentRoll}
          sequence={buildRollPresentationSequence(currentRoll, {
            instant: instantPlayback,
          })}
          instant={instantPlayback}
          onComplete={handleRollComplete}
        />
      ) : null}
    </div>
  )
}
