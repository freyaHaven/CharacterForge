import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { ResolvedDeferredCharacterRequirement } from '../../domain/types'
import type { ClassValidationResult } from '../../rules/class/classRules'
import { ClassIcon } from './ClassIcon'
import { createDeferredRequirementKey } from './classChoiceStateKeys'
import {
  formatAbilityList,
  formatArmorProficiencies,
  formatHitDie,
  formatWeaponProficiencies,
} from './formatClassDetails'
import { formatClassCompletionStatus } from './formatClassCompletionStatus'
import type { ClassSelectionDraft } from './classSelectionDraft'

function formatSummarySubtitle(
  level: number,
  subclassLabel: string | null,
): string {
  if (subclassLabel !== null) {
    return `Level ${level} · ${subclassLabel}`
  }

  return `Level ${level}`
}

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
    subclassChoice.options.find((option) => option.id === selectedValue)?.label ??
    null
  )
}

export type ClassSelectionSummaryProps = {
  definition: ClassDefinition
  level: number
  choices: Record<string, ClassChoiceValue>
  committedSelection: ClassSelection | null
  draft: ClassSelectionDraft | null
  draftValidation: ClassValidationResult | null
}

export function ClassSelectionSummary({
  definition,
  level,
  choices,
  committedSelection,
  draft,
  draftValidation,
}: ClassSelectionSummaryProps) {
  const subclassLabel = getSubclassLabel(definition, choices)
  const completionStatus = formatClassCompletionStatus({
    committedSelection,
    draft,
    draftValidation,
  })

  return (
    <section
      className="class-picker__summary"
      aria-labelledby="class-picker-summary-heading"
    >
      <div className="class-picker__summary-header">
        <span className="class-picker__summary-icon">
          <ClassIcon classId={definition.id} />
        </span>
        <div className="class-picker__summary-heading-text">
          <h3 id="class-picker-summary-heading">{definition.name}</h3>
          <p className="class-picker__summary-subtitle">
            {formatSummarySubtitle(level, subclassLabel)}
          </p>
          <p className="class-picker__summary-status" role="status">
            {completionStatus}
          </p>
        </div>
      </div>

      <article className="class-picker__summary-card">
        <p className="class-picker__summary-description">{definition.description}</p>

        <dl className="class-picker__summary-metadata">
          <div className="class-picker__summary-metadata-item">
            <dt>Primary Abilities</dt>
            <dd>{formatAbilityList(definition.primaryAbilities)}</dd>
          </div>
          <div className="class-picker__summary-metadata-item">
            <dt>Hit Die</dt>
            <dd>{formatHitDie(definition)}</dd>
          </div>
          <div className="class-picker__summary-metadata-item">
            <dt>Saving Throws</dt>
            <dd>{formatAbilityList(definition.savingThrows)}</dd>
          </div>
          <div className="class-picker__summary-metadata-item">
            <dt>Armour</dt>
            <dd>{formatArmorProficiencies(definition.proficiencies.armor)}</dd>
          </div>
          <div className="class-picker__summary-metadata-item">
            <dt>Weapons</dt>
            <dd>{formatWeaponProficiencies(definition.proficiencies.weapons)}</dd>
          </div>
        </dl>
      </article>
    </section>
  )
}

export type ClassDeferredRequirementsPanelProps = {
  requirements: readonly ResolvedDeferredCharacterRequirement[]
}

export function ClassDeferredRequirementsPanel({
  requirements,
}: ClassDeferredRequirementsPanelProps) {
  if (requirements.length === 0) {
    return null
  }

  return (
    <section
      className="class-picker__deferred"
      aria-labelledby="class-picker-deferred-heading"
    >
      <h4 id="class-picker-deferred-heading" className="class-picker__section-title">
        Remaining character decisions
      </h4>
      <ul className="class-picker__deferred-list">
        {requirements.map((requirement) => (
          <li
            key={createDeferredRequirementKey(
              requirement.sourceInstanceId,
              requirement.requirementId,
            )}
          >
            {requirement.description}
          </li>
        ))}
      </ul>
    </section>
  )
}
