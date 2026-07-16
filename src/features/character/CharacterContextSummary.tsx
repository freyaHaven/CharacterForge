import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import type { WizardStepId } from '../../app/wizard/types'
import { ClassIcon } from '../class/ClassIcon'
import type { ClassSelectionDrafts } from '../class/classSelectionDraft'
import { SpeciesIcon } from '../species/SpeciesIcon'
import type { SpeciesSelectionDraft } from '../species/speciesSelectionDraft'
import { hasCharacterContextContent } from './characterContextDisplay'
import { useCharacterContextDisplay } from './useCharacterContextDisplay'

export type CharacterContextSummaryProps = {
  character: Character
  activeStepId: WizardStepId
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
  speciesDraft: SpeciesSelectionDraft | null
  classDrafts: ClassSelectionDrafts
}

export function CharacterContextSummary({
  character,
  activeStepId,
  speciesCatalog,
  classCatalog,
  speciesDraft,
  classDrafts,
}: CharacterContextSummaryProps) {
  const display = useCharacterContextDisplay({
    character,
    activeStepId,
    speciesCatalog,
    classCatalog,
    speciesDraft,
    classDrafts,
  })

  if (
    activeStepId === 'basics' ||
    activeStepId === 'review' ||
    !hasCharacterContextContent(display)
  ) {
    return null
  }

  const showIcons =
    display.speciesId !== null || display.classEntries.length > 0

  return (
    <aside
      className="character-context"
      aria-label="Character context"
      data-testid="character-context-summary"
    >
      {showIcons ? (
        <div className="character-context__icons" aria-hidden="true">
          {display.speciesId !== null ? (
            <span className="character-context__icon">
              <SpeciesIcon speciesId={display.speciesId} />
            </span>
          ) : null}
          {display.classEntries.map((entry, index) => (
            <span
              key={`${entry.classId}-${entry.level}-${index}`}
              className="character-context__icon"
            >
              <ClassIcon classId={entry.classId} />
            </span>
          ))}
        </div>
      ) : null}
      <div className="character-context__lines">
        {display.identityLine !== null ? (
          <p className="character-context__line character-context__line--identity">
            {display.identityLine}
          </p>
        ) : null}
        {display.buildLine !== null ? (
          <p className="character-context__line character-context__line--build">
            {display.buildLine}
          </p>
        ) : null}
        {display.characterLevelLine !== null ? (
          <p className="character-context__line character-context__line--level">
            {display.characterLevelLine}
          </p>
        ) : null}
        {display.guidanceLine !== null ? (
          <p className="character-context__line character-context__line--guidance">
            {display.guidanceLine}
          </p>
        ) : null}
      </div>
    </aside>
  )
}
