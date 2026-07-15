import { useEffect, useMemo, useState } from 'react'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { EditionId } from '../../domain/types'
import type {
  AbilityScoreIncreaseSelection,
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import { BackgroundCatalogCard } from './BackgroundCatalogCard'
import { BackgroundChoicesPanel } from './BackgroundChoicesPanel'
import { BackgroundOverview } from './BackgroundOverview'
import { formatBackgroundValidationIssue } from './formatBackgroundValidation'
import {
  createBackgroundSelectionDraft,
  initializeBackgroundSelectionDraft,
  tryCommitBackgroundDraft,
  validateBackgroundDraft,
  updateBackgroundDraftAbilityScoreIncrease,
  updateBackgroundDraftChoice,
  type BackgroundSelectionDraft,
} from './backgroundSelectionDraft'

type BackgroundPickerProps = {
  editionId: EditionId
  committedSelection: BackgroundSelection | null
  draft: BackgroundSelectionDraft | null
  catalog: BackgroundCatalog
  onDraftChange: (draft: BackgroundSelectionDraft | null) => void
  onCommittedSelectionChange: (selection: BackgroundSelection | null) => void
}

export function BackgroundPicker({
  editionId,
  committedSelection,
  draft,
  catalog,
  onDraftChange,
  onCommittedSelectionChange,
}: BackgroundPickerProps) {
  const [backgroundList, setBackgroundList] = useState<BackgroundDefinition[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)

  const activeBackgroundId =
    draft?.backgroundId ?? committedSelection?.backgroundId ?? null
  const activeChoices = draft?.choices ?? committedSelection?.choices ?? {}
  const activeAbilityScoreIncrease =
    draft?.abilityScoreIncrease ??
    committedSelection?.abilityScoreIncrease ??
    null

  const activeDefinition =
    activeBackgroundId === null
      ? null
      : (backgroundList.find((entry) => entry.id === activeBackgroundId) ?? null)

  const draftValidation =
    draft === null || activeDefinition === null
      ? null
      : validateBackgroundDraft(draft, editionId, activeDefinition)

  const choiceIssueById = useMemo(() => {
    const issues = draftValidation?.ok === false ? draftValidation.issues : []
    const issueMap = new Map(
      issues
        .filter((issue) => issue.choiceId !== undefined)
        .map((issue) => [issue.choiceId as string, issue]),
    )

    const abilityIssue = issues.find(
      (issue) =>
        issue.code === 'missing-ability-score-increase' ||
        issue.code === 'invalid-ability-score-increase',
    )

    if (abilityIssue !== undefined) {
      issueMap.set('ability-score-increase', abilityIssue)
    }

    return issueMap
  }, [draftValidation])

  const overviewSelection = useMemo(() => {
    if (committedSelection !== null) {
      return committedSelection
    }

    if (activeDefinition === null || activeAbilityScoreIncrease === null) {
      return null
    }

    return {
      backgroundId: activeDefinition.id,
      abilityScoreIncrease: activeAbilityScoreIncrease,
      choices: activeChoices,
    } satisfies BackgroundSelection
  }, [
    activeAbilityScoreIncrease,
    activeChoices,
    activeDefinition,
    committedSelection,
  ])

  useEffect(() => {
    let isActive = true
    setIsLoading(true)

    void catalog.listBackgrounds(editionId).then((backgrounds) => {
      if (!isActive) {
        return
      }

      setBackgroundList(backgrounds)
      setIsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId])

  async function commitDraft(nextDraft: BackgroundSelectionDraft) {
    const definition = await catalog.getBackground(nextDraft.backgroundId)
    const { committed } = tryCommitBackgroundDraft(
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

  function ensureDraft(): BackgroundSelectionDraft | null {
    if (draft !== null) {
      return draft
    }

    if (activeBackgroundId === null) {
      return null
    }

    if (committedSelection !== null) {
      return initializeBackgroundSelectionDraft(committedSelection)
    }

    return createBackgroundSelectionDraft(activeBackgroundId)
  }

  function selectBackground(backgroundDefinition: BackgroundDefinition) {
    const nextDraft = createBackgroundSelectionDraft(backgroundDefinition.id)
    const { committed } = tryCommitBackgroundDraft(
      nextDraft,
      editionId,
      backgroundDefinition,
    )

    if (committed !== null) {
      onDraftChange(null)
      onCommittedSelectionChange(committed)
      return
    }

    onDraftChange(nextDraft)
    onCommittedSelectionChange(null)
  }

  async function handleChoiceChange(
    choiceId: string,
    optionId: string | undefined,
  ) {
    const currentDraft = ensureDraft()

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateBackgroundDraftChoice(
      currentDraft,
      choiceId,
      optionId,
    )
    await commitDraft(nextDraft)
  }

  async function handleAbilityScoreIncreaseChange(
    increase: AbilityScoreIncreaseSelection | null,
  ) {
    const currentDraft = ensureDraft()

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateBackgroundDraftAbilityScoreIncrease(
      currentDraft,
      increase,
    )
    await commitDraft(nextDraft)
  }

  function clearSelection() {
    onDraftChange(null)
    onCommittedSelectionChange(null)
  }

  return (
    <section
      className="background-picker"
      aria-labelledby="background-picker-heading"
    >
      <div className="background-picker__intro">
        <h2 id="background-picker-heading">Background</h2>
        <p className="helper-text">
          Choose a background for your character. Complete required choices to
          confirm your selection.
        </p>
      </div>

      {isLoading ? <p className="status">Loading backgrounds...</p> : null}

      {!isLoading && backgroundList.length === 0 ? (
        <p className="status">
          No bundled backgrounds are available for this rules edition yet.
        </p>
      ) : null}

      {!isLoading && backgroundList.length > 0 ? (
        <>
          <div className="background-picker__catalog-panel">
            <ul
              id="background-catalog-list"
              className="background-picker__catalog"
              role="list"
              aria-label="Choose a background"
            >
              {backgroundList.map((backgroundDefinition) => (
                <BackgroundCatalogCard
                  key={backgroundDefinition.id}
                  backgroundDefinition={backgroundDefinition}
                  isSelected={activeBackgroundId === backgroundDefinition.id}
                  onSelect={selectBackground}
                />
              ))}
            </ul>
          </div>

          {activeDefinition !== null ? (
            <div className="background-picker__content-layout">
              <BackgroundOverview
                definition={activeDefinition}
                selection={overviewSelection}
                abilityScoreIncrease={activeAbilityScoreIncrease}
              />
              <BackgroundChoicesPanel
                definition={activeDefinition}
                abilityScoreIncrease={activeAbilityScoreIncrease}
                choices={activeChoices}
                choiceIssueById={choiceIssueById}
                onAbilityScoreIncreaseChange={(value) => {
                  void handleAbilityScoreIncreaseChange(value)
                }}
                onChoiceChange={(choiceId, optionId) => {
                  void handleChoiceChange(choiceId, optionId)
                }}
              />
            </div>
          ) : (
            <div
              className="background-picker__overview background-picker__overview--placeholder"
              role="status"
            >
              <p>Select a background to preview its benefits and choices.</p>
            </div>
          )}
        </>
      ) : null}

      {activeDefinition !== null && committedSelection !== null ? (
        <p className="background-picker__selection">
          Selected: <strong>{activeDefinition.name}</strong>
        </p>
      ) : null}

      {draft !== null && committedSelection === null ? (
        <p className="background-picker__selection">
          Selecting: <strong>{activeDefinition?.name ?? 'Background'}</strong>{' '}
          (complete required choices to confirm)
        </p>
      ) : null}

      {draftValidation !== null && !draftValidation.ok ? (
        <div className="validation-message" role="alert">
          <p>Complete the background selection:</p>
          <ul>
            {draftValidation.issues.map((issue) => (
              <li key={`${issue.code}-${issue.choiceId ?? 'general'}`}>
                {formatBackgroundValidationIssue(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeBackgroundId !== null ? (
        <button
          type="button"
          className="background-picker__clear"
          onClick={clearSelection}
        >
          Clear background selection
        </button>
      ) : null}
    </section>
  )
}
