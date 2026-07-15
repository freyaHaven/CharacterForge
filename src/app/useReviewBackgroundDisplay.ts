import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { EditionId } from '../domain/types'
import type { BackgroundSelection } from '../domain/background/types'
import type { BackgroundSelectionDraft } from '../features/background/backgroundSelectionDraft'
import {
  formatAbilityScoreBonusSummary,
  formatBackgroundChoiceSummary,
  formatEquipmentSummary,
  formatToolProficiencySummary,
} from '../features/background/formatBackgroundDetails'
import { getBackgroundChoiceIds } from '../rules/background/backgroundRules'
import type { BackgroundReviewDisplay } from './reviewSummary'

const EMPTY_DISPLAY: BackgroundReviewDisplay = {
  backgroundName: null,
  choiceLines: [],
}

export function useReviewBackgroundDisplay(
  catalog: BackgroundCatalog,
  editionId: EditionId,
  committedSelection: BackgroundSelection | null,
  backgroundDraft: BackgroundSelectionDraft | null,
): BackgroundReviewDisplay {
  const [display, setDisplay] = useState<BackgroundReviewDisplay>(EMPTY_DISPLAY)

  useEffect(() => {
    const activeSelection =
      backgroundDraft !== null && backgroundDraft.abilityScoreIncrease !== null
        ? {
            backgroundId: backgroundDraft.backgroundId,
            abilityScoreIncrease: backgroundDraft.abilityScoreIncrease,
            choices: backgroundDraft.choices,
          }
        : committedSelection

    if (activeSelection === null) {
      if (backgroundDraft === null) {
        setDisplay(EMPTY_DISPLAY)
        return
      }

      void catalog.getBackground(backgroundDraft.backgroundId).then((definition) => {
        setDisplay({
          backgroundName: definition?.name ?? null,
          choiceLines: [],
        })
      })

      return
    }

    let isActive = true

    void catalog.getBackground(activeSelection.backgroundId).then((definition) => {
      if (!isActive) {
        return
      }

      if (definition === null) {
        setDisplay(EMPTY_DISPLAY)
        return
      }

      const choiceLines: { prompt: string; summary: string }[] = [
        {
          prompt: 'Ability Score Bonuses',
          summary: formatAbilityScoreBonusSummary(definition, activeSelection),
        },
        {
          prompt: 'Tool Proficiency',
          summary: formatToolProficiencySummary(definition, activeSelection),
        },
        {
          prompt: 'Equipment',
          summary: formatEquipmentSummary(definition, activeSelection),
        },
      ]

      for (const choiceId of getBackgroundChoiceIds(definition)) {
        const summary = formatBackgroundChoiceSummary(
          definition,
          activeSelection,
          choiceId,
        )

        if (summary === null) {
          continue
        }

        if (
          definition.toolProficiency.kind === 'choice' &&
          choiceId === definition.toolProficiency.choiceId
        ) {
          continue
        }

        choiceLines.push({
          prompt:
            definition.toolProficiency.kind === 'choice' &&
            choiceId === definition.toolProficiency.choiceId
              ? definition.toolProficiency.prompt
              : choiceId,
          summary,
        })
      }

      setDisplay({
        backgroundName: definition.name,
        choiceLines,
      })
    })

    return () => {
      isActive = false
    }
  }, [backgroundDraft, catalog, committedSelection, editionId])

  return display
}
