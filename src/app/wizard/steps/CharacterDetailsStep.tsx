import { useEffect, useState } from 'react'
import type { SpeciesCatalog } from '../../../domain/ports/speciesCatalog'
import type { CharacterDetails, SpeciesSelection } from '../../../domain/types'
import type { SpeciesGuidance } from '../../../domain/species/types'
import { CharacterDetailsFields } from '../../../features/character-details/CharacterDetailsFields'

type CharacterDetailsStepProps = {
  speciesSelection: SpeciesSelection | null
  details: CharacterDetails
  catalog: SpeciesCatalog
  onDetailsChange: (updates: Partial<CharacterDetails>) => void
  onDetailsTouched: () => void
}

export function CharacterDetailsStep({
  speciesSelection,
  details,
  catalog,
  onDetailsChange,
  onDetailsTouched,
}: CharacterDetailsStepProps) {
  const [speciesGuidance, setSpeciesGuidance] = useState<SpeciesGuidance | null>(
    null,
  )

  useEffect(() => {
    if (speciesSelection === null) {
      setSpeciesGuidance(null)
      return
    }

    let isActive = true

    void catalog.getSpecies(speciesSelection.speciesId).then((definition) => {
      if (!isActive) {
        return
      }

      setSpeciesGuidance(definition?.guidance ?? null)
    })

    return () => {
      isActive = false
    }
  }, [catalog, speciesSelection])

  return (
    <section
      aria-labelledby="wizard-step-character-details-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-character-details-heading">Character Details</h2>
      <p className="wizard-step-panel__intro">
        Optional descriptive information for your character. None of these fields
        affect mechanics or block completion.
      </p>

      <CharacterDetailsFields
        details={details}
        speciesGuidance={speciesGuidance}
        onChange={onDetailsChange}
        onTouched={onDetailsTouched}
      />
    </section>
  )
}
