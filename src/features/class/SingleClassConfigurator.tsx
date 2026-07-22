import type { HitPointIncrease } from '../../domain/class/hitPointIncreases'
import type { AbilityScores, EditionId } from '../../domain/types'
import type {
  CharacterClassSelection,
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import { validateClassSelection } from '../../rules/class/classRules'
import { ClassOverviewPanel } from './ClassOverviewPanel'
import { ClassProgressionSection } from './ClassProgressionSection'
import type { ClassSelectionDraft } from './classSelectionDraft'

export type SingleClassConfiguratorProps = {
  editionId: EditionId
  activeInstanceId: string | null
  activeDefinition: ClassDefinition
  activeClassId: string
  activeLevel: number
  activeChoices: Record<string, ClassChoiceValue>
  maxInstanceLevel: number
  draft: ClassSelectionDraft | null
  committedSelection: ClassSelection | null
  isStartingClass: boolean
  isConfiguringReplacement?: boolean
  committedClassName?: string | null
  hitPointIncreases?: readonly HitPointIncrease[]
  hitPointsLabel?: string | null
  featCatalog: FeatCatalog
  characterFeatId?: string | null
  abilityScores: AbilityScores
  characterLevel: number
  eligibilityClasses: readonly CharacterClassSelection[]
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>
  ownedProficientSkillIds?: ReadonlySet<string> | readonly string[]
  onLevelChange: (level: number) => void
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
  onHitPointIncreaseChange: (
    classLevel: number,
    patch: Partial<Pick<HitPointIncrease, 'method' | 'rolledValue'>>,
  ) => void
}

export function SingleClassConfigurator({
  editionId,
  activeInstanceId,
  activeDefinition,
  activeClassId,
  activeLevel,
  activeChoices,
  maxInstanceLevel,
  draft,
  committedSelection,
  isStartingClass,
  isConfiguringReplacement = false,
  committedClassName = null,
  hitPointIncreases,
  hitPointsLabel = null,
  featCatalog,
  characterFeatId = null,
  abilityScores,
  characterLevel,
  eligibilityClasses,
  classDefinitionsById,
  ownedProficientSkillIds,
  onLevelChange,
  onChoiceChange,
  onHitPointIncreaseChange,
}: SingleClassConfiguratorProps) {
  const draftValidation =
    draft === null
      ? null
      : validateClassSelection(
          {
            classId: draft.classId,
            level: draft.level,
            choices: draft.choices,
          },
          editionId,
          activeDefinition,
        )

  return (
    <div className="class-picker__single-class-layout">
      <ClassOverviewPanel
        definition={activeDefinition}
        level={activeLevel}
        maxLevel={maxInstanceLevel}
        choices={activeChoices}
        committedSelection={committedSelection}
        draft={draft}
        draftValidation={draftValidation}
        hitPointsLabel={hitPointsLabel}
        isConfiguringReplacement={isConfiguringReplacement}
        committedClassName={committedClassName}
        onLevelChange={onLevelChange}
      />
      <ClassProgressionSection
        editionId={editionId}
        activeInstanceId={activeInstanceId}
        activeDefinition={activeDefinition}
        activeClassId={activeClassId}
        activeLevel={activeLevel}
        activeChoices={activeChoices}
        draft={draft}
        isStartingClass={isStartingClass}
        hitPointIncreases={hitPointIncreases}
        featCatalog={featCatalog}
        characterFeatId={characterFeatId}
        abilityScores={abilityScores}
        characterLevel={characterLevel}
        eligibilityClasses={eligibilityClasses}
        classDefinitionsById={classDefinitionsById}
        ownedProficientSkillIds={ownedProficientSkillIds}
        onChoiceChange={onChoiceChange}
        onHitPointIncreaseChange={onHitPointIncreaseChange}
      />
    </div>
  )
}
