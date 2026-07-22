import { useEffect, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatDefinition, FeatSelection } from '../../domain/feat/types'
import {
  EMPTY_FEAT_ELIGIBILITY_CONTEXT,
  type FeatEligibility,
  type FeatEligibilityContext,
} from '../../domain/feat/eligibility'
import {
  evaluateFeatForEntitlement,
  partitionFeatCatalogue,
  type FeatEntitlementPolicy,
} from '../../domain/feat/catalogueEligibility'
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
  /** Character-scoped eligibility context for prerequisite checks. */
  eligibilityContext?: FeatEligibilityContext
  /** Entitlement policy for this picker (defaults to any qualifying feat). */
  entitlementPolicy?: FeatEntitlementPolicy
  /** Optional override used by tests. */
  getEligibility?: (definition: FeatDefinition) => FeatEligibility
}

export function FeatPicker({
  editionId,
  committedSelection,
  draft,
  catalog,
  onDraftChange,
  onCommittedSelectionChange,
  eligibilityContext = EMPTY_FEAT_ELIGIBILITY_CONTEXT,
  entitlementPolicy = { kind: 'any-qualifying' },
  getEligibility,
}: FeatPickerProps) {
  const [featList, setFeatList] = useState<FeatDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnavailable, setShowUnavailable] = useState(false)

  const activeFeatId = draft?.featId ?? committedSelection?.featId ?? null
  const activeChoices = draft?.choices ?? committedSelection?.choices ?? {}

  const resolveEligibility =
    getEligibility ??
    ((definition: FeatDefinition) =>
      evaluateFeatForEntitlement(
        definition,
        eligibilityContext,
        entitlementPolicy,
      ))

  const catalogueFeats = useMemo(() => {
    if (getEligibility !== undefined) {
      const eligible: ReturnType<typeof partitionFeatCatalogue>['visible'] = []
      const retained: ReturnType<typeof partitionFeatCatalogue>['visible'] = []
      const unavailable: ReturnType<typeof partitionFeatCatalogue>['visible'] =
        []

      for (const definition of featList) {
        const eligibility = getEligibility(definition)
        const isSelected = activeFeatId === definition.id
        if (eligibility.eligible) {
          eligible.push({
            definition,
            eligibility,
            retainedInvalid: false,
          })
        } else if (isSelected) {
          retained.push({
            definition,
            eligibility,
            retainedInvalid: true,
          })
        } else {
          unavailable.push({
            definition,
            eligibility,
            retainedInvalid: false,
          })
        }
      }

      return showUnavailable
        ? [...eligible, ...retained, ...unavailable]
        : [...eligible, ...retained]
    }

    return partitionFeatCatalogue({
      feats: featList,
      context: eligibilityContext,
      policy: entitlementPolicy,
      selectedFeatId: activeFeatId,
      showUnavailable,
    }).visible
  }, [
    activeFeatId,
    eligibilityContext,
    entitlementPolicy,
    featList,
    getEligibility,
    showUnavailable,
  ])

  const activeDefinition =
    activeFeatId === null
      ? null
      : (featList.find((entry) => entry.id === activeFeatId) ??
        catalogueFeats.find((entry) => entry.definition.id === activeFeatId)
          ?.definition ??
        null)

  const filteredEntries = useMemo(() => {
    const definitions = catalogueFeats.map((entry) => entry.definition)
    const matched = new Set(
      filterFeatsByName(definitions, searchQuery).map((feat) => feat.id),
    )
    return catalogueFeats.filter((entry) => matched.has(entry.definition.id))
  }, [catalogueFeats, searchQuery])

  const normalizedSearchQuery = searchQuery.trim()
  const isSelectedFeatHidden =
    activeFeatId !== null &&
    normalizedSearchQuery.length > 0 &&
    !filteredEntries.some((entry) => entry.definition.id === activeFeatId)

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

  const activeEligibility =
    activeDefinition === null
      ? null
      : resolveEligibility(activeDefinition)

  useEffect(() => {
    setSearchQuery('')
    setShowUnavailable(false)
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
    const eligibility = resolveEligibility(featDefinition)

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

    const eligibility = resolveEligibility(activeDefinition)
    if (!eligibility.eligible) {
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
              <label className="feat-picker__show-unavailable">
                <input
                  type="checkbox"
                  checked={showUnavailable}
                  onChange={(event) => {
                    setShowUnavailable(event.target.checked)
                  }}
                />
                <span>Show unavailable feats</span>
              </label>
            </div>

            {filteredEntries.length === 0 ? (
              <p className="feat-picker__catalog-empty" role="status">
                {normalizedSearchQuery.length > 0
                  ? `No feats match “${normalizedSearchQuery}”.`
                  : showUnavailable
                    ? 'No feats are available for this rules edition yet.'
                    : 'No eligible feats for this character. Enable “Show unavailable feats” to browse prerequisites.'}
              </p>
            ) : (
              <ul
                id="feat-catalog-list"
                className="feat-picker__catalog"
                role="list"
                aria-label="Choose a feat"
              >
                {filteredEntries.map((entry) => (
                  <FeatCatalogCard
                    key={entry.definition.id}
                    featDefinition={entry.definition}
                    isSelected={activeFeatId === entry.definition.id}
                    eligibility={entry.eligibility}
                    retainedInvalid={entry.retainedInvalid}
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

                {activeEligibility !== null && !activeEligibility.eligible ? (
                  <p className="feat-picker__invalid-selection" role="status">
                    This selection is invalid: {activeEligibility.reason}. Clear
                    or replace it to continue.
                  </p>
                ) : null}

                {showChoicesForDetail ? (
                  <div className="feat-picker__choices">
                    {activeDefinition.choices.map((choice) => {
                      if (choice.type !== 'single-select') {
                        return null
                      }

                      const selectedOptionId = activeChoices[choice.id] ?? ''

                      return (
                        <label key={choice.id} className="field">
                          <span>{choice.prompt}</span>
                          <select
                            value={
                              typeof selectedOptionId === 'string'
                                ? selectedOptionId
                                : ''
                            }
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
                  {canConfirm &&
                  (activeEligibility === null || activeEligibility.eligible) ? (
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
