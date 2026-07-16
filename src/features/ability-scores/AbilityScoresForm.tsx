import { useMemo } from 'react'
import { getBundledContentRegistry } from '../../content/registry/bundledContent'
import { computeAbilityScoreBonuses } from '../../domain/background/computeAbilityScoreBonuses'
import type { BackgroundSelection } from '../../domain/background/types'
import type {
  AbilityScores,
  CharacterCreationMethod,
} from '../../domain/types'
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MIN_SCORE,
  validatePointBuyAssignment,
} from '../../rules/point-buy'
import { createEmptyRolledAssignments } from '../../rules/rolled'
import { SingleSelectCardGrid } from '../choices/SingleSelectCardGrid'
import type { AbilityScoreBonusMap } from './resolveAbilityScoreBreakdown'
import { buildAbilityScoreBreakdown } from './resolveAbilityScoreBreakdown'
import { AbilityScoreBreakdown } from './AbilityScoreBreakdown'
import {
  ABILITY_SCORE_METHOD_UI_OPTIONS,
  isManualOrRolledMethod,
  toAbilityScoreMethodUiId,
  toCreationMethodFromUiId,
  type AbilityScoreMethodUiId,
} from './abilityScoreMethodOptions'
import { formatPointBuyValidation } from './formatPointBuyValidation'
import { ManualAbilityInputs } from './ManualAbilityInputs'
import { PointBuyAbilityInputs } from './PointBuyAbilityInputs'
import { type PointBuyDraftScores } from './pointBuyDraft'
import { RolledAbilityInputs } from './RolledAbilityInputs'
import { RolledPoolPanel } from './RolledPoolPanel'
import { type RolledDraft } from './rolledDraft'
import { StandardArrayAbilityInputs } from './StandardArrayAbilityInputs'
import {
  hasStandardArrayAssignments,
  type StandardArrayDraftScores,
  validateStandardArrayDraft,
} from './standardArrayDraft'

type AbilityScoresFormProps = {
  creationMethod: CharacterCreationMethod
  abilityScores: AbilityScores
  standardArrayDraft: StandardArrayDraftScores | null
  pointBuyDraft: PointBuyDraftScores | null
  rolledDraft: RolledDraft | null
  prefersReducedMotion: boolean
  backgroundSelection?: BackgroundSelection | null
  onCreationMethodChange: (creationMethod: CharacterCreationMethod) => void
  onAbilityScoreChange: (ability: keyof AbilityScores, value: number) => void
  onStandardArrayDraftChange: (
    ability: keyof StandardArrayDraftScores,
    value: number | null,
  ) => void
  onClearStandardArray: () => void
  onApplyDefaultStandardArray: () => void
  onStartPointBuy: () => void
  onResetPointBuy: () => void
  onAdjustPointBuyScore: (
    ability: keyof PointBuyDraftScores,
    delta: -1 | 1,
  ) => void
  onRolledPoolReady: (draft: RolledDraft) => void
  onRolledAssignmentChange: (
    ability: keyof AbilityScores,
    rollId: string | null,
  ) => void
  randomSource?: () => number
}

function resolveBonusMap(
  backgroundSelection: BackgroundSelection | null | undefined,
): AbilityScoreBonusMap {
  if (backgroundSelection == null) {
    return {}
  }

  const definition = getBundledContentRegistry().getBackground(
    backgroundSelection.backgroundId,
  )

  if (
    definition === null ||
    backgroundSelection.abilityScoreIncrease === null
  ) {
    return {}
  }

  const bonuses = computeAbilityScoreBonuses(
    definition,
    backgroundSelection.abilityScoreIncrease,
  )
  const sourceLabel = definition.name
  const bonusMap: AbilityScoreBonusMap = {}

  for (const [abilityId, amount] of Object.entries(bonuses)) {
    if (typeof amount !== 'number' || amount === 0) {
      continue
    }

    bonusMap[abilityId as keyof AbilityScores] = [{ amount, sourceLabel }]
  }

  return bonusMap
}

function resolveBaseScores(options: {
  creationMethod: CharacterCreationMethod
  abilityScores: AbilityScores
  standardArrayDraft: StandardArrayDraftScores | null
  pointBuyDraft: PointBuyDraftScores | null
  rolledDraft: RolledDraft | null
}): Partial<Record<keyof AbilityScores, number | null>> {
  const {
    creationMethod,
    abilityScores,
    standardArrayDraft,
    pointBuyDraft,
    rolledDraft,
  } = options

  if (creationMethod === 'standard-array' && standardArrayDraft !== null) {
    return standardArrayDraft
  }

  if (creationMethod === 'point-buy' && pointBuyDraft !== null) {
    return pointBuyDraft
  }

  if (creationMethod === 'rolled') {
    if (rolledDraft === null) {
      return {
        strength: null,
        dexterity: null,
        constitution: null,
        intelligence: null,
        wisdom: null,
        charisma: null,
      }
    }

    const assignedTotal = (ability: keyof AbilityScores): number | null => {
      const rollId = rolledDraft.assignments[ability]
      if (rollId === null) {
        return null
      }

      return (
        rolledDraft.pool.find((entry) => entry.id === rollId)?.total ?? null
      )
    }

    return {
      strength: assignedTotal('strength'),
      dexterity: assignedTotal('dexterity'),
      constitution: assignedTotal('constitution'),
      intelligence: assignedTotal('intelligence'),
      wisdom: assignedTotal('wisdom'),
      charisma: assignedTotal('charisma'),
    }
  }

  return abilityScores
}

export function AbilityScoresForm({
  creationMethod,
  abilityScores,
  standardArrayDraft,
  pointBuyDraft,
  rolledDraft,
  prefersReducedMotion,
  backgroundSelection = null,
  onCreationMethodChange,
  onAbilityScoreChange,
  onStandardArrayDraftChange,
  onClearStandardArray,
  onApplyDefaultStandardArray,
  onStartPointBuy,
  onResetPointBuy,
  onAdjustPointBuyScore,
  onRolledPoolReady,
  onRolledAssignmentChange,
  randomSource = Math.random,
}: AbilityScoresFormProps) {
  const methodUiId = toAbilityScoreMethodUiId(creationMethod)
  const bonuses = useMemo(
    () => resolveBonusMap(backgroundSelection),
    [backgroundSelection],
  )
  const standardArrayValidation =
    creationMethod === 'standard-array' && standardArrayDraft !== null
      ? validateStandardArrayDraft(standardArrayDraft)
      : null
  const showClearStandardArray =
    creationMethod === 'standard-array' &&
    standardArrayDraft !== null &&
    hasStandardArrayAssignments(standardArrayDraft)
  const showApplyDefaultStandardArray =
    creationMethod === 'standard-array' &&
    standardArrayDraft !== null &&
    standardArrayValidation !== null &&
    !standardArrayValidation.valid
  const pointBuyValidation =
    creationMethod === 'point-buy' && pointBuyDraft !== null
      ? validatePointBuyAssignment(pointBuyDraft)
      : null
  const pointBuyMessages =
    pointBuyValidation === null
      ? []
      : formatPointBuyValidation(pointBuyValidation)

  const breakdown = buildAbilityScoreBreakdown({
    baseScores: resolveBaseScores({
      creationMethod,
      abilityScores,
      standardArrayDraft,
      pointBuyDraft,
      rolledDraft,
    }),
    bonuses,
  })

  function handleMethodSelect(optionId: string) {
    const nextMethod = toCreationMethodFromUiId(
      optionId as AbilityScoreMethodUiId,
      creationMethod,
    )

    if (nextMethod !== creationMethod) {
      onCreationMethodChange(nextMethod)
    }
  }

  return (
    <section className="ability-scores-form">
      <div className="ability-scores-form__header">
        <h2
          id="wizard-step-ability-scores-heading"
          className="ability-scores-form__title"
        >
          Ability Scores
        </h2>
        <div className="ability-scores-form__method">
          <span id="ability-method-legend" className="sr-only">
            Ability score method
          </span>
          <SingleSelectCardGrid
            id="ability-score-method"
            name="ability-score-method"
            options={ABILITY_SCORE_METHOD_UI_OPTIONS}
            selectedOptionId={methodUiId}
            onSelect={handleMethodSelect}
            ariaLabelledBy="ability-method-legend"
          />
        </div>
      </div>

      <div className="ability-scores-form__method-controls">
        {creationMethod === 'standard-array' && standardArrayDraft !== null ? (
          <>
            <div className="standard-array-actions">
              {showClearStandardArray ? (
                <button type="button" onClick={onClearStandardArray}>
                  Clear assignments
                </button>
              ) : null}
              {showApplyDefaultStandardArray ? (
                <button type="button" onClick={onApplyDefaultStandardArray}>
                  Apply default standard array
                </button>
              ) : null}
            </div>

            {showApplyDefaultStandardArray ? (
              <p className="helper-text">
                Default layout: STR 15, DEX 14, CON 13, INT 12, WIS 10, CHA 8 —
                a starting layout only, not a class recommendation.
              </p>
            ) : null}
          </>
        ) : null}

        {creationMethod === 'point-buy' ? (
          <>
            {pointBuyDraft === null ? (
              <div className="point-buy-actions">
                <button type="button" onClick={onStartPointBuy}>
                  Start Point Buy
                </button>
                <p className="helper-text">
                  Your current scores are not a legal point-buy assignment.
                  Start Point Buy to begin from all 8s without changing saved
                  scores yet.
                </p>
              </div>
            ) : (
              <>
                <div className="point-buy-remaining" aria-live="polite">
                  <p className="point-buy-remaining__label">Points Remaining</p>
                  <p className="point-buy-remaining__value">
                    {pointBuyValidation?.remaining ?? 0} / {POINT_BUY_BUDGET}
                  </p>
                </div>

                {pointBuyMessages.length > 0 ? (
                  <div className="validation-message" role="alert">
                    <p>Fix the point-buy assignment:</p>
                    <ul>
                      {pointBuyMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Object.values(pointBuyDraft).some(
                  (score) => score !== POINT_BUY_MIN_SCORE,
                ) ? (
                  <div className="point-buy-actions">
                    <button type="button" onClick={onResetPointBuy}>
                      Reset all to 8
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>

      <div className="ability-scores-form__overview">
        {creationMethod === 'standard-array' && standardArrayDraft !== null ? (
          <StandardArrayAbilityInputs
            draft={standardArrayDraft}
            bonuses={bonuses}
            onDraftChange={onStandardArrayDraftChange}
          />
        ) : null}

        {creationMethod === 'point-buy' && pointBuyDraft !== null ? (
          <PointBuyAbilityInputs
            draft={pointBuyDraft}
            bonuses={bonuses}
            onAdjustScore={onAdjustPointBuyScore}
          />
        ) : null}

        {creationMethod === 'manual' ? (
          <ManualAbilityInputs
            abilityScores={abilityScores}
            bonuses={bonuses}
            onAbilityScoreChange={onAbilityScoreChange}
          />
        ) : null}

        {creationMethod === 'rolled' ? (
          <RolledAbilityInputs
            pool={rolledDraft?.pool ?? []}
            assignments={
              rolledDraft?.assignments ?? createEmptyRolledAssignments()
            }
            bonuses={bonuses}
            onAssignmentChange={onRolledAssignmentChange}
          />
        ) : null}
      </div>

      {isManualOrRolledMethod(creationMethod) ? (
        <RolledPoolPanel
          draft={creationMethod === 'rolled' ? rolledDraft : null}
          prefersReducedMotion={prefersReducedMotion}
          randomSource={randomSource}
          onPoolReady={onRolledPoolReady}
        />
      ) : null}

      <AbilityScoreBreakdown entries={breakdown} />
    </section>
  )
}
