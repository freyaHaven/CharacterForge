import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ROLLING_FORMULA_ID,
  ROLLED_ABILITY_SCORE_COUNT,
  generateAbilityScorePool,
  type GeneratedAbilityScoreResult,
} from '../../rules/rolled'
import {
  createRolledDraftFromGeneratedResults,
  shouldConfirmReroll,
  type RolledDraft,
} from './rolledDraft'
import { buildRollPresentationSequence } from './rollPresentation'
import { DiceRollGroup } from './DiceRollGroup'
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
    playback === null ? null : (playback.rolls[playback.currentIndex] ?? null)
  const isAnimating = playback !== null && currentRoll !== null
  const instantPlayback =
    playback?.skipAll === true ||
    playback?.skipCurrent === true ||
    prefersReducedMotion

  const completedGroups =
    playback !== null && playback.completedResults.length > 0
      ? playback.completedResults
      : null
  const settledGroups =
    draft !== null && playback === null ? draft.pool : null

  return (
    <div className="rolled-panel">
      <div className="dice-roll-groups">
        <h3 className="dice-roll-groups__heading">Dice Roll Groups</h3>

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

        {completedGroups !== null ? (
          <div className="dice-roll-groups__grid">
            {completedGroups.map((result, index) => (
              <DiceRollGroup
                key={`completed-${index}`}
                result={result}
                title={`Roll ${index + 1}`}
              />
            ))}
          </div>
        ) : null}

        {settledGroups !== null ? (
          <div className="dice-roll-groups__grid">
            {settledGroups.map((entry, index) => (
              <DiceRollGroup
                key={entry.id}
                result={entry.result}
                title={`Roll ${index + 1}`}
              />
            ))}
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
    </div>
  )
}
