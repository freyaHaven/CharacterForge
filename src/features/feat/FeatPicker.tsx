import { useEffect, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatDefinition, FeatSelection } from '../../domain/feat/types'
import { evaluateFeatEligibility } from '../../domain/feat/eligibility'
import type { FeatEligibility } from '../../domain/feat/eligibility'
import { validateFeatSelection } from '../../rules/feat/featRules'
import { FeatCatalogCard } from './FeatCatalogCard'
import { FeatOverview } from './FeatOverview'
import { filterFeatsByName } from './filterFeatsByName'
import { formatFeatValidationIssue } from './formatFeatValidation'
import {
  createFeatSelectionDraft,
  draftToFeatSelection,
  initializeFeatSelectionDraft,
  tryCommitFeatDraft,
  updateFeatDraftChoice,
  type FeatSelectionDraft,
} from './featSelectionDraft'

type FeatPickerProps = {
  editionId: EditionId
  committedSelection: FeatSelection | null
  draft: FeatSelectionDraft | null
  catalog: FeatCatalog
  onDraftChange: (draft: FeatSelectionDraft | null) => void
  onCommittedSelectionChange: (selection: FeatSelection | null) => void
  /** Optional override used by tests and future character-context eligibility. */
  getEligibility?: (definition: FeatDefinition) => FeatEligibility
}

export function FeatPicker({
  editionId,
  committedSelection,
  draft,
  catalog,
  onDraftChange,
  onCommittedSelectionChange,
  getEligibility = evaluateFeatEligibility,
}: FeatPickerProps) {
  const [featList, setFeatList] = useState<FeatDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const activeFeatId = draft?.featId ?? committedSelection?.featId ?? null
  const activeChoices = draft?.choices ?? committedSelection?.choices ?? {}

  const activeDefinition =
    activeFeatId === null
      ? null
      : (featList.find((entry) => entry.id === activeFeatId) ?? null)

  const filteredFeats = useMemo(
    () => filterFeatsByName(featList, searchQuery),
    [featList, searchQuery],
  )

  const normalizedSearchQuery = searchQuery.trim()
  const isSelectedFeatHidden =
    activeFeatId !== null &&
    normalizedSearchQuery.length > 0 &&
    !filteredFeats.some((feat) => feat.id === activeFeatId)

  const draftValidation =
    draft === null
      ? null
      : validateFeatSelection(
          draftToFeatSelection(draft),
          editionId,
          activeDefinition,
        )

  const hasPendingDraft =
    draft !== null &&
    (committedSelection === null ||
      draft.featId !== committedSelection.featId ||
      JSON.stringify(draft.choices) !== JSON.stringify(committedSelection.choices))

  const canConfirm =
    draft !== null &&
    draftValidation?.ok === true &&
    hasPendingDraft

  useEffect(() => {
    setSearchQuery('')
  }, [editionId])

  useEffect(() => {
    let isActive = true
    setIsLoading(true)

    void catalog.listFeats(editionId).then((feats) => {
      if (!isActive) {
        return
      }

      setFeatList(feats)
      setIsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId])

  function previewFeat(featDefinition: FeatDefinition) {
    const eligibility = getEligibility(featDefinition)

    if (!eligibility.eligible) {
      return
    }

    if (
      committedSelection?.featId === featDefinition.id &&
      draft === null
    ) {
      return
    }

    onDraftChange(createFeatSelectionDraft(featDefinition.id))
  }

  function confirmSelection() {
    if (draft === null || activeDefinition === null) {
      return
    }

    const { committed } = tryCommitFeatDraft(
      draft,
      editionId,
      activeDefinition,
    )

    if (committed === null) {
      return
    }

    onDraftChange(null)
    onCommittedSelectionChange(committed)
  }

  async function handleChoiceChange(choiceId: string, optionId: string) {
    const currentDraft =
      draft ??
      (activeFeatId === null
        ? null
        : initializeFeatSelectionDraft({
            featId: activeFeatId,
            choices: activeChoices,
          }))

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateFeatDraftChoice(
      currentDraft,
      choiceId,
      optionId === '' ? undefined : optionId,
    )

    onDraftChange(nextDraft)

    if (
      committedSelection !== null &&
      nextDraft.featId === committedSelection.featId
    ) {
      onCommittedSelectionChange(null)
    }
  }

  function clearSelection() {
    onDraftChange(null)
    onCommittedSelectionChange(null)
  }

  const showChoicesForDetail =
    activeDefinition !== null && activeDefinition.choices.length > 0

  const actionLabel =
    committedSelection === null
      ? 'Select this feat'
      : draft !== null && draft.featId !== committedSelection.featId
        ? 'Change to this feat'
        : 'Confirm feat selection'

  return (
    <section className="feat-picker" aria-labelledby="feat-picker-heading">
      <div className="feat-picker__intro">
        <h2 id="feat-picker-heading">Feats</h2>
        <p className="helper-text">
          Optionally choose one feat for this character. Automatic feat slots
          from backgrounds and class progression will arrive later.
        </p>
      </div>

      {isLoading ? <p className="status">Loading feats...</p> : null}

      {!isLoading && featList.length === 0 ? (
        <p className="status">
          No bundled feats are available for this rules edition yet.
        </p>
      ) : null}

      {!isLoading && featList.length > 0 ? (
        <div className="feat-picker__layout">
          <div className="feat-picker__catalog-panel">
            <div className="feat-picker__catalog-toolbar">
              <label className="feat-picker__search field">
                <span>Search feats</span>
                <input
                  type="search"
                  value={searchQuery}
                  placeholder="Search by name or category…"
                  aria-controls="feat-catalog-list"
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                  }}
                />
              </label>
            </div>

            {filteredFeats.length === 0 ? (
              <p className="feat-picker__catalog-empty" role="status">
                No feats match &ldquo;{normalizedSearchQuery}&rdquo;.
              </p>
            ) : (
              <ul
                id="feat-catalog-list"
                className="feat-picker__catalog"
                role="list"
                aria-label="Choose a feat"
              >
                {filteredFeats.map((featDefinition) => (
                  <FeatCatalogCard
                    key={featDefinition.id}
                    featDefinition={featDefinition}
                    isSelected={activeFeatId === featDefinition.id}
                    eligibility={getEligibility(featDefinition)}
                    onSelect={previewFeat}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="feat-picker__detail-panel">
            {isSelectedFeatHidden ? (
              <p className="feat-picker__detail-hidden-note" role="status">
                The selected feat is hidden by the current search.
              </p>
            ) : null}

            {activeDefinition !== null ? (
              <>
                <FeatOverview
                  definition={activeDefinition}
                  isCommitted={
                    committedSelection?.featId === activeDefinition.id &&
                    draft === null
                  }
                />

                {showChoicesForDetail ? (
                  <div className="feat-picker__choices">
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
                            <option value="">Select an option…</option>
                            {choice.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )
                    })}
                  </div>
                ) : null}

                <div className="feat-picker__actions">
                  {canConfirm ? (
                    <button
                      type="button"
                      className="feat-picker__confirm"
                      onClick={confirmSelection}
                    >
                      {actionLabel}
                    </button>
                  ) : null}

                  {activeFeatId !== null ? (
                    <button
                      type="button"
                      className="feat-picker__clear"
                      onClick={clearSelection}
                    >
                      Clear feat selection
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <div
                className="feat-picker__overview feat-picker__overview--placeholder"
                role="status"
              >
                <p>Select a feat from the catalogue to preview its benefits.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {draft !== null && committedSelection === null ? (
        <p className="feat-picker__selection">
          Previewing: <strong>{activeDefinition?.name ?? 'Feat'}</strong>
          {draftValidation?.ok === true
            ? ' — confirm to save this selection'
            : ' — complete required choices to confirm'}
        </p>
      ) : null}

      {draftValidation !== null && !draftValidation.ok ? (
        <div className="validation-message" role="alert">
          <p>Complete the feat selection:</p>
          <ul>
            {draftValidation.issues.map((issue) => (
              <li key={`${issue.code}-${issue.choiceId ?? 'general'}`}>
                {formatFeatValidationIssue(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
