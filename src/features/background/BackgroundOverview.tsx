import type {
  AbilityScoreIncreaseSelection,
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import { BackgroundIcon } from './BackgroundIcon'
import {
  formatAbilityScoreBonusSummary,
  formatAbilityScoreOptions,
  formatEquipmentSummary,
  formatSkillProficiencyList,
  formatToolProficiencySummary,
} from './formatBackgroundDetails'

type BackgroundOverviewProps = {
  definition: BackgroundDefinition
  selection: BackgroundSelection | null
  abilityScoreIncrease: AbilityScoreIncreaseSelection | null
}

export function BackgroundOverview({
  definition,
  selection,
  abilityScoreIncrease,
}: BackgroundOverviewProps) {
  const bonusSummarySelection: BackgroundSelection | null =
    selection ??
    (abilityScoreIncrease === null
      ? null
      : {
          backgroundId: definition.id,
          abilityScoreIncrease,
          choices: {},
        })

  const abilityScoreBonusSummary =
    bonusSummarySelection === null
      ? null
      : formatAbilityScoreBonusSummary(definition, bonusSummarySelection)

  return (
    <article className="background-picker__overview">
      <header className="background-picker__overview-header">
        <div className="background-picker__overview-title-row">
          <span className="background-picker__overview-icon">
            <BackgroundIcon backgroundId={definition.id} />
          </span>
          <div className="background-picker__overview-text">
            <h3>{definition.name}</h3>
            <p className="background-picker__overview-lead">
              {definition.description}
            </p>
          </div>
        </div>
      </header>

      <dl className="background-picker__metadata">
        <div className="background-picker__metadata-item">
          <dt>Ability Score Options</dt>
          <dd>{formatAbilityScoreOptions(definition.eligibleAbilityScores)}</dd>
        </div>
        <div className="background-picker__metadata-item">
          <dt>Origin Feat</dt>
          <dd>
            <strong>{definition.originFeat.name}</strong>
            <p>{definition.originFeat.description}</p>
          </dd>
        </div>
        <div className="background-picker__metadata-item">
          <dt>Skill Proficiencies</dt>
          <dd>{formatSkillProficiencyList(definition.skillProficiencies)}</dd>
        </div>
        <div className="background-picker__metadata-item">
          <dt>Tool Proficiency</dt>
          <dd>{formatToolProficiencySummary(definition, selection)}</dd>
        </div>
        <div className="background-picker__metadata-item">
          <dt>Equipment</dt>
          <dd>{formatEquipmentSummary(definition, selection)}</dd>
        </div>
        {abilityScoreBonusSummary !== null &&
        abilityScoreBonusSummary !== 'Not configured' ? (
          <div className="background-picker__metadata-item">
            <dt>Ability Score Bonuses</dt>
            <dd>{abilityScoreBonusSummary}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}
