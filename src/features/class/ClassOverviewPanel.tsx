import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { ClassValidationResult } from '../../rules/class/classRules'
import type { ClassSelectionDraft } from './classSelectionDraft'
import { ClassInsignia } from './ClassInsignia'
import { ClassOverviewReferenceChips } from './ClassOverviewReferenceChips'
import {
  formatAbilityChipLabels,
  formatArmorProficiencyChipLabels,
  formatHitDie,
  formatWeaponProficiencyChipLabels,
} from './formatClassDetails'
import { LevelStepper } from './LevelStepper'

function getSubclassLabel(
  definition: ClassDefinition,
  choices: Record<string, ClassChoiceValue>,
): string | null {
  const subclassChoice = definition.choices.find(
    (choice) =>
      choice.id.endsWith('-subclass') && choice.type === 'single-select',
  )

  if (subclassChoice?.type !== 'single-select') {
    return null
  }

  const selectedValue = choices[subclassChoice.id]

  if (typeof selectedValue !== 'string') {
    return null
  }

  return (
    subclassChoice.options.find((option) => option.id === selectedValue)
      ?.label ?? null
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
  /** Character hit point maximum label, e.g. `28` or `—`. */
  hitPointsLabel?: string | null
  onLevelChange: (level: number) => void
}

export function ClassOverviewPanel({
  definition,
  level,
  maxLevel,
  choices,
  hitPointsLabel = null,
  onLevelChange,
}: ClassOverviewPanelProps) {
  const subclassLabel = getSubclassLabel(definition, choices)

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
            <ClassInsignia classId={definition.id} />
          </span>
          <div className="class-picker__overview-heading-text">
            <div className="class-picker__overview-title-row">
              <p className="class-picker__overview-class-name">
                {definition.name}
              </p>
              <LevelStepper
                value={level}
                max={maxLevel}
                label="Level"
                compact
                onChange={onLevelChange}
              />
            </div>
            {subclassLabel !== null ? (
              <p className="class-picker__summary-subtitle">{subclassLabel}</p>
            ) : null}
          </div>
        </div>

        <p className="class-picker__overview-description">
          {definition.description}
        </p>

        <dl className="class-picker__overview-metadata">
          <div className="class-picker__overview-metadata-group">
            <dt>Primary Abilities</dt>
            <dd>
              <ClassOverviewReferenceChips
                items={formatAbilityChipLabels(definition.primaryAbilities)}
              />
            </dd>
          </div>

          <div className="class-picker__overview-metadata-row">
            <div className="class-picker__overview-metadata-group">
              <dt>Hit Die</dt>
              <dd>{formatHitDie(definition, level)}</dd>
            </div>

            <div className="class-picker__overview-metadata-group">
              <dt>Hit Points</dt>
              <dd>{hitPointsLabel ?? '—'}</dd>
            </div>
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
        </dl>
      </div>
    </aside>
  )
}
