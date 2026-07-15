import { CREATION_METHOD_OPTIONS } from '../creation-method/creationMethodOptions'
import type {
  AbilityScores,
  CharacterCreationMethod,
} from '../../domain/types'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import { AbilityScoreCard } from './AbilityScoreCard'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'
import { formatPointBuyValidation } from './formatPointBuyValidation'
import { formatRolledValidation } from './formatRolledValidation'
import { PointBuyAbilityInputs } from './PointBuyAbilityInputs'
import {
  type PointBuyDraftScores,
} from './pointBuyDraft'
import { RolledAbilityInputs } from './RolledAbilityInputs'
import { RolledPoolPanel } from './RolledPoolPanel'
import {
  type RolledDraft,
  validateRolledDraft,
} from './rolledDraft'
import {
  formatRemainingRolledResults,
  getRemainingRolledResults,
} from './rolledRemaining'
import {
  POINT_BUY_BUDGET,
  validatePointBuyAssignment,
} from '../../rules/point-buy'
import { formatStandardArrayValidation } from './formatStandardArrayValidation'
import {
  formatRemainingStandardArrayValues,
  getRemainingStandardArrayValues,
} from './standardArrayRemaining'
import { StandardArrayAbilityInputs } from './StandardArrayAbilityInputs'
import {
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
  const standardArrayMessages =
    standardArrayValidation === null
      ? []
      : formatStandardArrayValidation(standardArrayValidation)
  const remainingStandardArrayValues =
    standardArrayDraft === null
      ? []
      : getRemainingStandardArrayValues(standardArrayDraft)
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
  const rolledValidation =
    creationMethod === 'rolled' && rolledDraft !== null
      ? validateRolledDraft(rolledDraft)
      : null
  const rolledMessages =
    rolledValidation === null || rolledValidation.valid
      ? []
      : formatRolledValidation(rolledValidation)
  const remainingRolledResults =
    rolledDraft === null
      ? []
      : getRemainingRolledResults(rolledDraft.pool, rolledDraft.assignments)
  const showManualInputs = creationMethod === 'manual'

  return (
    <section className="ability-scores-form">
      <label className="field">
        <span>Ability score method</span>
        <select
          value={creationMethod}
          onChange={(event) =>
            onCreationMethodChange(
              event.target.value as CharacterCreationMethod,
            )
          }
        >
          {CREATION_METHOD_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

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

          {standardArrayMessages.length > 0 ? (
            <div className="validation-message" role="alert">
              <p>Complete the standard array assignment:</p>
              <ul>
                {standardArrayMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="standard-array-actions">
            <button type="button" onClick={onClearStandardArray}>
              Clear assignments
            </button>
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

              {pointBuyValidation?.valid === true &&
              pointBuyValidation.remaining > 0 ? (
                <p className="info-message">
                  You still have {pointBuyValidation.remaining} unspent points.
                  Saving is allowed.
                </p>
              ) : null}

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

          {rolledMessages.length > 0 ? (
            <div className="validation-message" role="alert">
              <p>Complete the rolled assignment:</p>
              <ul>
                {rolledMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {rolledDraft !== null ? (
            <RolledAbilityInputs
              pool={rolledDraft.pool}
              assignments={rolledDraft.assignments}
              onAssignmentChange={onRolledAssignmentChange}
            />
          ) : null}
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
