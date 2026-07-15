import type { EditionId } from '../../domain/types'
import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
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
  onLevelChange: (level: number) => void
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
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
  onLevelChange,
  onChoiceChange,
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
        onLevelChange={onLevelChange}
        onChoiceChange={onChoiceChange}
      />
      <ClassProgressionSection
        editionId={editionId}
        activeInstanceId={activeInstanceId}
        activeDefinition={activeDefinition}
        activeClassId={activeClassId}
        activeLevel={activeLevel}
        activeChoices={activeChoices}
        draft={draft}
        onChoiceChange={onChoiceChange}
      />
    </div>
  )
}
