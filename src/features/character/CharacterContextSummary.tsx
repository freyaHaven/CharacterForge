import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import type { WizardStepId } from '../../app/wizard/types'
import type { ClassSelectionDrafts } from '../class/classSelectionDraft'
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

  if (activeStepId === 'basics' || !hasCharacterContextContent(display)) {
    return null
  }

  return (
    <aside
      className="character-context"
      aria-label="Character context"
      data-testid="character-context-summary"
    >
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
