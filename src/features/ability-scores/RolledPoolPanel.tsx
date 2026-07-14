import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ROLLING_FORMULA_ID,
  ROLLED_ABILITY_SCORE_COUNT,
  ROLLED_MAX_TOTAL,
  ROLLED_MIN_TOTAL,
  generateAbilityScorePool,
  getRollingFormula,
  type GeneratedAbilityScoreResult,
} from '../../rules/rolled'
import {
  createRolledDraftFromGeneratedResults,
  createRolledDraftFromManualTotals,
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

const EMPTY_MANUAL_TOTALS = ['', '', '', '', '', ''] as const

export function RolledPoolPanel({
  draft,
  prefersReducedMotion,
  randomSource,
  onPoolReady,
}: RolledPoolPanelProps) {
  const [playback, setPlayback] = useState<PlaybackSession | null>(null)
  const [manualTotals, setManualTotals] = useState<string[]>([...EMPTY_MANUAL_TOTALS])
  const [manualError, setManualError] = useState<string | null>(null)
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
    setManualError(null)
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

  function handleUseManualTotals() {
    const parsedTotals = manualTotals.map((value) => Number.parseInt(value, 10))

    if (parsedTotals.some((value) => Number.isNaN(value))) {
      setManualError('Enter a number for each of the six results.')
      return
    }

    const nextDraft = createRolledDraftFromManualTotals(parsedTotals)

    if ('error' in nextDraft) {
      setManualError(
        nextDraft.error === 'invalid-count'
          ? 'Enter exactly six manual results.'
          : `Each manual result must be between ${ROLLED_MIN_TOTAL} and ${ROLLED_MAX_TOTAL}.`,
      )
      return
    }

    if (
      draft !== null &&
      shouldConfirmReroll(draft.assignments) &&
      !window.confirm(
        'Replacing the pool will clear your current assignments. Continue?',
      )
    ) {
      return
    }

    setManualError(null)
    onPoolReady(nextDraft)
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

      <div className="rolled-manual-entry">
        <p className="rolled-manual-entry__title">Enter rolls manually</p>
        <div className="rolled-manual-entry__inputs">
          {manualTotals.map((value, index) => (
            <label key={`manual-${index}`} className="rolled-manual-entry__field">
              <span>Result {index + 1}</span>
              <input
                type="number"
                min={ROLLED_MIN_TOTAL}
                max={ROLLED_MAX_TOTAL}
                value={value}
                onChange={(event) => {
                  const nextTotals = [...manualTotals]
                  nextTotals[index] = event.target.value
                  setManualTotals(nextTotals)
                  setManualError(null)
                }}
              />
            </label>
          ))}
        </div>
        {manualError !== null ? (
          <p className="validation-message" role="alert">
            {manualError}
          </p>
        ) : null}
        <button type="button" onClick={handleUseManualTotals} disabled={isAnimating}>
          Use these rolls
        </button>
      </div>
    </div>
  )
}
