import { CREATION_METHOD_OPTIONS } from '../creation-method/creationMethodOptions'
import type {
  AbilityScores,
  CharacterCreationMethod,
} from '../../domain/types'
import {
  POINT_BUY_BUDGET,
  validatePointBuyAssignment,
} from '../../rules/point-buy'
import { createEmptyRolledAssignments } from '../../rules/rolled'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import { AbilityScoreCard } from './AbilityScoreCard'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'
import { formatPointBuyValidation } from './formatPointBuyValidation'
import { PointBuyAbilityInputs } from './PointBuyAbilityInputs'
import {
  type PointBuyDraftScores,
} from './pointBuyDraft'
import { RolledAbilityInputs } from './RolledAbilityInputs'
import { RolledPoolPanel } from './RolledPoolPanel'
import {
  type RolledDraft,
} from './rolledDraft'
import {
  formatRemainingRolledResults,
  getRemainingRolledResults,
} from './rolledRemaining'
import {
  formatRemainingStandardArrayValues,
  getRemainingStandardArrayValues,
} from './standardArrayRemaining'
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

export function AbilityScoresForm({
  creationMethod,
  abilityScores,
  standardArrayDraft,
  pointBuyDraft,
  rolledDraft,
  prefersReducedMotion,
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
  const standardArrayValidation =
    creationMethod === 'standard-array' && standardArrayDraft !== null
      ? validateStandardArrayDraft(standardArrayDraft)
      : null
  const remainingStandardArrayValues =
    standardArrayDraft === null
      ? []
      : getRemainingStandardArrayValues(standardArrayDraft)
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
    pointBuyValidation === null ? [] : formatPointBuyValidation(pointBuyValidation)
  const remainingRolledResults =
    rolledDraft === null
      ? []
      : getRemainingRolledResults(rolledDraft.pool, rolledDraft.assignments)
  const showManualInputs = creationMethod === 'manual'

  return (
    <section className="ability-scores-form">
      <fieldset className="ability-method">
        <legend id="ability-method-legend" className="ability-method__legend">
          Ability score method
        </legend>
        <div
          className="ability-method__options"
          role="radiogroup"
          aria-labelledby="ability-method-legend"
        >
          {CREATION_METHOD_OPTIONS.map((option) => (
            <label key={option.id} className="ability-method__option">
              <input
                type="radio"
                name="ability-score-method"
                value={option.id}
                checked={creationMethod === option.id}
                onChange={() => {
                  onCreationMethodChange(option.id)
                }}
              />
              <span className="ability-method__option-content">
                <span className="ability-method__option-title">{option.label}</span>
                <span className="ability-method__option-description">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {creationMethod === 'standard-array' && standardArrayDraft !== null ? (
        <>
          <div className="standard-array-guidance">
            <p className="helper-text">
              Assign each score exactly once. Higher scores give stronger
              bonuses. You can rearrange them freely before saving.
            </p>
            <p className="remaining-values">
              Remaining scores:{' '}
              {formatRemainingStandardArrayValues(remainingStandardArrayValues)}
            </p>
          </div>

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

          <StandardArrayAbilityInputs
            draft={standardArrayDraft}
            onDraftChange={onStandardArrayDraftChange}
          />
        </>
      ) : creationMethod === 'point-buy' ? (
        <>
          <div className="point-buy-guidance">
            <p className="helper-text">
              Spend up to {POINT_BUY_BUDGET} points to set ability scores between
              8 and 15. Higher scores cost more points.
            </p>
          </div>

          {pointBuyDraft === null ? (
            <div className="point-buy-actions">
              <button type="button" onClick={onStartPointBuy}>
                Start Point Buy
              </button>
              <p className="helper-text">
                Your current scores are not a legal point-buy assignment. Start
                Point Buy to begin from all 8s without changing saved scores yet.
              </p>
            </div>
          ) : (
            <>
              <p className="point-buy-budget">
                Points spent: {pointBuyValidation?.spent ?? 0} / {POINT_BUY_BUDGET}{' '}
                · Remaining: {pointBuyValidation?.remaining ?? 0}
              </p>

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

              <div className="point-buy-actions">
                <button type="button" onClick={onResetPointBuy}>
                  Reset all to 8
                </button>
              </div>

              <PointBuyAbilityInputs
                draft={pointBuyDraft}
                onAdjustScore={onAdjustPointBuyScore}
              />
            </>
          )}
        </>
      ) : creationMethod === 'rolled' ? (
        <>
          <div className="rolled-guidance">
            <p className="helper-text">
              Roll six ability scores, then assign each result to one ability.
              Duplicate totals stay distinct while assigning.
            </p>
            {rolledDraft !== null ? (
              <p className="remaining-values">
                Remaining results:{' '}
                {formatRemainingRolledResults(remainingRolledResults)}
              </p>
            ) : null}
          </div>

          <RolledPoolPanel
            draft={rolledDraft}
            prefersReducedMotion={prefersReducedMotion}
            randomSource={randomSource}
            onPoolReady={onRolledPoolReady}
          />

          <RolledAbilityInputs
            pool={rolledDraft?.pool ?? []}
            assignments={
              rolledDraft?.assignments ?? createEmptyRolledAssignments()
            }
            onAssignmentChange={onRolledAssignmentChange}
          />
        </>
      ) : showManualInputs ? (
        <AbilityScoreCardGrid>
          {ABILITY_SCORE_ENTRIES.map(({ key, abbreviation, label }) => (
            <AbilityScoreCard
              key={key}
              abilityKey={key}
              abbreviation={abbreviation}
              scoreLabel={label}
              score={abilityScores[key]}
              variant="interactive"
              controls={
                <input
                  type="number"
                  min={1}
                  max={30}
                  aria-label={`${label} score`}
                  value={abilityScores[key]}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10)
                    onAbilityScoreChange(key, Number.isNaN(value) ? 10 : value)
                  }}
                />
              }
            />
          ))}
        </AbilityScoreCardGrid>
      ) : null}
    </section>
  )
}
