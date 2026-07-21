import { useEffect, useState } from 'react'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { CharacterDetails, SpeciesSelection } from '../../domain/types'
import type { SpeciesGuidance } from '../../domain/species/types'
import { CharacterDetailsFields } from './CharacterDetailsFields'

export type CharacterDetailsSectionProps = {
  speciesSelection: SpeciesSelection | null
  details: CharacterDetails
  speciesCatalog: SpeciesCatalog
  onDetailsChange: (updates: Partial<CharacterDetails>) => void
  onDetailsTouched: () => void
}

/**
 * Optional character-level details editor (identity, personality, backstory).
 * Data lives on Character.details — not on background selection.
 */
export function CharacterDetailsSection({
  speciesSelection,
  details,
  speciesCatalog,
  onDetailsChange,
  onDetailsTouched,
}: CharacterDetailsSectionProps) {
  const [speciesGuidance, setSpeciesGuidance] = useState<SpeciesGuidance | null>(
    null,
  )

  useEffect(() => {
    if (speciesSelection === null) {
      setSpeciesGuidance(null)
      return
    }

    let isActive = true

    void speciesCatalog.getSpecies(speciesSelection.speciesId).then((definition) => {
      if (!isActive) {
        return
      }

      setSpeciesGuidance(definition?.guidance ?? null)
    })

    return () => {
      isActive = false
    }
  }, [speciesCatalog, speciesSelection])

  return (
    <section
      className="character-details-section"
      aria-labelledby="character-details-section-heading"
    >
      <div className="character-details-section__intro">
        <h2 id="character-details-section-heading">Character Details</h2>
        <p className="helper-text">
          Optional. Descriptive information for your character. None of these
          fields affect mechanics or block completion.
        </p>
      </div>

      <CharacterDetailsFields
        details={details}
        speciesGuidance={speciesGuidance}
        onChange={onDetailsChange}
        onTouched={onDetailsTouched}
      />
    </section>
  )
}
