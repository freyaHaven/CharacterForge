import { useEffect, useMemo, useState } from 'react'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { EditionId } from '../../domain/types'
import type {
  SpeciesDefinition,
  SpeciesSelection,
} from '../../domain/species/types'
import { validateSpeciesSelection } from '../../rules/species/speciesRules'
import { filterSpeciesByName } from './filterSpeciesByName'
import { formatSpeciesValidationIssue } from './formatSpeciesValidation'
import { SpeciesCatalogCard } from './SpeciesCatalogCard'
import { SpeciesIcon } from './SpeciesIcon'
import { SizeStatIcon, SpeedStatIcon, TraitIcon } from './SpeciesUiIcons'
import {
  createSpeciesSelectionDraft,
  draftToSpeciesSelection,
  initializeSpeciesSelectionDraft,
  tryCommitSpeciesDraft,
  updateSpeciesDraftChoice,
  type SpeciesSelectionDraft,
} from './speciesSelectionDraft'

function formatSize(size: SpeciesDefinition['size']): string {
  return size.charAt(0).toUpperCase() + size.slice(1)
}

type SpeciesPickerProps = {
  editionId: EditionId
  committedSelection: SpeciesSelection | null
  draft: SpeciesSelectionDraft | null
  catalog: SpeciesCatalog
  onDraftChange: (draft: SpeciesSelectionDraft | null) => void
  onCommittedSelectionChange: (selection: SpeciesSelection | null) => void
}

export function SpeciesPicker({
  editionId,
  committedSelection,
  draft,
  catalog,
  onDraftChange,
  onCommittedSelectionChange,
}: SpeciesPickerProps) {
  const [speciesList, setSpeciesList] = useState<SpeciesDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const activeSpeciesId =
    draft?.speciesId ?? committedSelection?.speciesId ?? null
  const activeChoices = draft?.choices ?? committedSelection?.choices ?? {}

  const activeDefinition =
    activeSpeciesId === null
      ? null
      : (speciesList.find((species) => species.id === activeSpeciesId) ?? null)

  const filteredSpecies = useMemo(
    () => filterSpeciesByName(speciesList, searchQuery),
    [speciesList, searchQuery],
  )

  const normalizedSearchQuery = searchQuery.trim()
  const isSelectedSpeciesHidden =
    activeSpeciesId !== null &&
    normalizedSearchQuery.length > 0 &&
    !filteredSpecies.some((species) => species.id === activeSpeciesId)

  const draftValidation =
    draft === null
      ? null
      : validateSpeciesSelection(
          draftToSpeciesSelection(draft),
          editionId,
          activeDefinition,
        )

  useEffect(() => {
    setSearchQuery('')
  }, [editionId])

  useEffect(() => {
    let isActive = true
    setIsLoading(true)

    void catalog.listSpecies(editionId).then((species) => {
      if (!isActive) {
        return
      }

      setSpeciesList(species)
      setIsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId])

  async function commitDraft(nextDraft: SpeciesSelectionDraft) {
    const definition = await catalog.getSpecies(nextDraft.speciesId)
    const { committed } = tryCommitSpeciesDraft(
      nextDraft,
      editionId,
      definition,
    )

    if (committed !== null) {
      onDraftChange(null)
      onCommittedSelectionChange(committed)
      return
    }

    onDraftChange(nextDraft)
    onCommittedSelectionChange(null)
  }

  function selectSpecies(species: SpeciesDefinition) {
    const nextDraft = createSpeciesSelectionDraft(species.id)
    const { committed } = tryCommitSpeciesDraft(nextDraft, editionId, species)

    if (committed !== null) {
      onDraftChange(null)
      onCommittedSelectionChange(committed)
      return
    }

    onDraftChange(nextDraft)
    onCommittedSelectionChange(null)
  }

  async function handleChoiceChange(choiceId: string, optionId: string) {
    const currentDraft =
      draft ??
      (activeSpeciesId === null
        ? null
        : initializeSpeciesSelectionDraft({
            speciesId: activeSpeciesId,
            choices: activeChoices,
          }))

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateSpeciesDraftChoice(
      currentDraft,
      choiceId,
      optionId === '' ? undefined : optionId,
    )

    await commitDraft(nextDraft)
  }

  function clearSelection() {
    onDraftChange(null)
    onCommittedSelectionChange(null)
  }

  const showChoicesForDetail =
    activeDefinition !== null && activeDefinition.choices.length > 0

  return (
    <section className="species-picker" aria-labelledby="species-picker-heading">
      <div className="species-picker__intro">
        <h2 id="species-picker-heading">Species</h2>
        <p className="helper-text">
          Choose a species for your character. This step is optional for now.
        </p>
      </div>

      {isLoading ? <p className="status">Loading species...</p> : null}

      {!isLoading && speciesList.length === 0 ? (
        <p className="status">
          No bundled species are available for this rules edition yet.
        </p>
      ) : null}

      {!isLoading && speciesList.length > 0 ? (
        <div className="species-picker__layout">
          <div className="species-picker__catalog-panel">
            <div className="species-picker__catalog-toolbar">
              <label className="species-picker__search field">
                <span>Search species</span>
                <input
                  type="search"
                  value={searchQuery}
                  placeholder="Search by name…"
                  aria-controls="species-catalog-list"
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                  }}
                />
              </label>
              <div
                className="species-picker__catalog-filters"
                hidden
                aria-hidden="true"
              />
            </div>

            {filteredSpecies.length === 0 ? (
              <p className="species-picker__catalog-empty" role="status">
                No species match &ldquo;{normalizedSearchQuery}&rdquo;.
              </p>
            ) : (
              <ul
                id="species-catalog-list"
                className="species-picker__catalog"
                role="list"
              >
                {filteredSpecies.map((species) => (
                  <SpeciesCatalogCard
                    key={species.id}
                    species={species}
                    isSelected={activeSpeciesId === species.id}
                    onSelect={selectSpecies}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="species-picker__detail-panel">
            {isSelectedSpeciesHidden ? (
              <p className="species-picker__detail-hidden-note" role="status">
                The selected species is hidden by the current search.
              </p>
            ) : null}

            {activeDefinition !== null ? (
              <article className="species-picker__detail">
                <div className="species-picker__identity-row">
                  <span className="species-picker__detail-icon">
                    <SpeciesIcon speciesId={activeDefinition.id} />
                  </span>
                  <div className="species-picker__detail-text">
                    <h3>{activeDefinition.name}</h3>
                    <p className="species-picker__detail-lead">
                      {activeDefinition.description}
                    </p>
                    <dl className="species-picker__metadata">
                      <div className="species-picker__metadata-item">
                        <span
                          className="species-picker__metadata-icon"
                          aria-hidden="true"
                        >
                          <SizeStatIcon />
                        </span>
                        <dt>Size</dt>
                        <dd>{formatSize(activeDefinition.size)}</dd>
                      </div>
                      <div className="species-picker__metadata-item">
                        <span
                          className="species-picker__metadata-icon"
                          aria-hidden="true"
                        >
                          <SpeedStatIcon />
                        </span>
                        <dt>Speed</dt>
                        <dd>{activeDefinition.speed.walk} feet</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {activeDefinition.traits.length > 0 ? (
                  <div className="species-picker__traits">
                    <h4 className="species-picker__section-title">Traits</h4>
                    <div className="species-picker__trait-cards">
                      {activeDefinition.traits.map((trait) => (
                        <article
                          key={trait.id}
                          className="species-picker__trait-card"
                        >
                          <span
                            className="species-picker__trait-icon"
                            aria-hidden="true"
                          >
                            <TraitIcon traitId={trait.id} />
                          </span>
                          <div className="species-picker__trait-content">
                            <h5>{trait.name}</h5>
                            <p>{trait.description}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
                {showChoicesForDetail ? (
                  <div className="species-picker__choices">
                    {activeDefinition.choices.map((choice) => {
                      const selectedOptionId = activeChoices[choice.id] ?? ''

                      return (
                        <label key={choice.id} className="field">
                          <span>{choice.prompt}</span>
                          <select
                            value={selectedOptionId}
                            onChange={(event) => {
                              void handleChoiceChange(
                                choice.id,
                                event.target.value,
                              )
                            }}
                          >
                            <option value="">Select an ancestor…</option>
                            {choice.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {choice.id === 'draconic-ancestry' ? (
                            <p className="helper-text">
                              The damage type of your selected ancestor applies
                              to your Breath Weapon and Damage Resistance.
                            </p>
                          ) : null}
                        </label>
                      )
                    })}
                  </div>
                ) : null}
              </article>
            ) : (
              <div
                className="species-picker__detail species-picker__detail--placeholder"
                aria-hidden="true"
              >
                <p>Select a species to preview its traits and abilities.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeDefinition !== null && committedSelection !== null ? (
        <p className="species-picker__selection">
          Selected: <strong>{activeDefinition.name}</strong>
        </p>
      ) : null}

      {draft !== null && committedSelection === null ? (
        <p className="species-picker__selection">
          Selecting: <strong>{activeDefinition?.name ?? 'Species'}</strong>{' '}
          (complete required choices to confirm)
        </p>
      ) : null}

      {draftValidation !== null && !draftValidation.ok ? (
        <div className="validation-message" role="alert">
          <p>Complete the species selection:</p>
          <ul>
            {draftValidation.issues.map((issue) => (
              <li key={`${issue.code}-${issue.choiceId ?? 'general'}`}>
                {formatSpeciesValidationIssue(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeSpeciesId !== null ? (
        <button
          type="button"
          className="species-picker__clear"
          onClick={clearSelection}
        >
          Clear species selection
        </button>
      ) : null}
    </section>
  )
}
