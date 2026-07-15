import { useMemo } from 'react'
import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { ClassValidationResult } from '../../rules/class/classRules'
import { ClassIcon } from './ClassIcon'
import { ClassMultiSelectChoiceField } from './ClassMultiSelectChoiceField'
import { ClassOverviewReferenceChips } from './ClassOverviewReferenceChips'
import {
  formatAbilityChipLabels,
  formatArmorProficiencyChipLabels,
  formatHitDie,
  formatWeaponProficiencyChipLabels,
} from './formatClassDetails'
import { formatClassCompletionStatus } from './formatClassCompletionStatus'
import { formatClassValidationIssue } from './formatClassValidation'
import type { ClassSelectionDraft } from './classSelectionDraft'
import {
  formatOverviewSetupChoicePrompt,
  getOverviewSetupChoiceHeading,
  getOverviewSetupChoices,
} from './classOverviewSetupChoices'
import { LevelStepper } from './LevelStepper'

function getSubclassLabel(
  definition: ClassDefinition,
  choices: Record<string, ClassChoiceValue>,
): string | null {
  const subclassChoice = definition.choices.find(
    (choice) => choice.id === 'fighter-subclass',
  )

  if (subclassChoice?.type !== 'single-select') {
    return null
  }

  const selectedValue = choices['fighter-subclass']

  if (typeof selectedValue !== 'string') {
    return null
  }

  return (
    subclassChoice.options.find((option) => option.id === selectedValue)?.label ??
    null
  )
}

export type ClassOverviewPanelProps = {
  definition: ClassDefinition
  level: number
  maxLevel: number
  choices: Record<string, ClassChoiceValue>
  committedSelection: ClassSelection | null
  draft: ClassSelectionDraft | null
  draftValidation: ClassValidationResult | null
  onLevelChange: (level: number) => void
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
}

export function ClassOverviewPanel({
  definition,
  level,
  maxLevel,
  choices,
  committedSelection,
  draft,
  draftValidation,
  onLevelChange,
  onChoiceChange,
}: ClassOverviewPanelProps) {
  const subclassLabel = getSubclassLabel(definition, choices)
  const completionStatus = formatClassCompletionStatus({
    committedSelection,
    draft,
    draftValidation,
  })

  const setupChoices = getOverviewSetupChoices(definition, level)

  const choiceIssueById = useMemo(() => {
    const issues = draftValidation?.ok === false ? draftValidation.issues : []

    return new Map(
      issues
        .filter((issue) => issue.choiceId !== undefined)
        .map((issue) => [issue.choiceId as string, issue]),
    )
  }, [draftValidation])

  return (
    <aside
      className="class-picker__overview-column"
      aria-labelledby="class-overview-heading"
    >
      <h3 id="class-overview-heading" className="class-picker__section-title">
        Class Overview
      </h3>

      <div className="class-picker__overview-card">
        <div className="class-picker__overview-header">
          <span className="class-picker__overview-icon">
            <ClassIcon classId={definition.id} />
          </span>
          <div className="class-picker__overview-heading-text">
            <p className="class-picker__overview-class-name">{definition.name}</p>
            <p className="class-picker__summary-subtitle">
              {subclassLabel !== null ? `Level ${level} · ${subclassLabel}` : `Level ${level}`}
            </p>
            <p className="class-picker__summary-status" role="status">
              {completionStatus}
            </p>
          </div>
        </div>

        <div className="class-picker__overview-level">
          <LevelStepper
            value={level}
            max={maxLevel}
            label="Levels in this class"
            onChange={onLevelChange}
          />
        </div>

        <p className="class-picker__overview-description">{definition.description}</p>

        <dl className="class-picker__overview-metadata">
          <div className="class-picker__overview-metadata-group">
            <dt>Primary Abilities</dt>
            <dd>
              <ClassOverviewReferenceChips
                items={formatAbilityChipLabels(definition.primaryAbilities)}
              />
            </dd>
          </div>

          <div className="class-picker__overview-metadata-group">
            <dt>Hit Die</dt>
            <dd>{formatHitDie(definition)}</dd>
          </div>

          <div className="class-picker__overview-metadata-group">
            <dt>Saving Throws</dt>
            <dd>
              <ClassOverviewReferenceChips
                items={formatAbilityChipLabels(definition.savingThrows)}
              />
            </dd>
          </div>

          <div className="class-picker__overview-metadata-group">
            <dt>Armour</dt>
            <dd>
              <ClassOverviewReferenceChips
                items={formatArmorProficiencyChipLabels(
                  definition.proficiencies.armor,
                )}
              />
            </dd>
          </div>

          <div className="class-picker__overview-metadata-group">
            <dt>Weapons</dt>
            <dd>
              <ClassOverviewReferenceChips
                items={formatWeaponProficiencyChipLabels(
                  definition.proficiencies.weapons,
                )}
              />
            </dd>
          </div>

          {setupChoices.map((choice) => {
            const headingId = `overview-setup-heading-${choice.id}`
            const promptId = `overview-setup-prompt-${choice.id}`
            const issue = choiceIssueById.get(choice.id)
            const errorId =
              issue === undefined
                ? undefined
                : `class-choice-error-${choice.id}`

            return (
              <div
                key={choice.id}
                className="class-picker__overview-metadata-group"
              >
                <dt id={headingId}>{getOverviewSetupChoiceHeading(choice)}</dt>
                <dd>
                  <p
                    id={promptId}
                    className="class-picker__overview-skill-prompt"
                  >
                    {formatOverviewSetupChoicePrompt(choice)}
                  </p>
                  <ClassMultiSelectChoiceField
                    choice={choice}
                    value={choices[choice.id]}
                    errorId={errorId}
                    labelledBy={`${headingId} ${promptId}`}
                    onChange={onChoiceChange}
                  />
                  {issue !== undefined && errorId !== undefined ? (
                    <p
                      id={errorId}
                      className="class-picker__choice-error"
                      role="alert"
                    >
                      {formatClassValidationIssue(issue)}
                    </p>
                  ) : null}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </aside>
  )
}
