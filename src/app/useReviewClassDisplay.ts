import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import { getChoicesAvailableAtLevel } from '../domain/class/choiceAvailability'
import type { EditionId } from '../domain/types'
import type { ClassSelection } from '../domain/class/types'
import type { ClassSelectionDraft } from '../features/class/classSelectionDraft'
import type { ClassReviewDisplay } from './reviewSummary'

const EMPTY_DISPLAY: ClassReviewDisplay = {
  className: null,
  level: null,
  choiceLines: [],
}

function formatChoiceSummary(
  prompt: string,
  labels: string[],
): { prompt: string; summary: string } {
  return {
    prompt,
    summary: labels.join(', '),
  }
}

export function useReviewClassDisplay(
  catalog: ClassCatalog,
  editionId: EditionId,
  committedSelection: ClassSelection | null,
  classDraft: ClassSelectionDraft | null,
): ClassReviewDisplay {
  const [display, setDisplay] = useState<ClassReviewDisplay>(EMPTY_DISPLAY)

  useEffect(() => {
    const activeSelection =
      classDraft === null
        ? committedSelection
        : {
            classId: classDraft.classId,
            level: classDraft.level,
            choices: classDraft.choices,
          }

    if (activeSelection === null) {
      setDisplay(EMPTY_DISPLAY)
      return
    }

    let isActive = true

    void catalog.getClass(activeSelection.classId).then((definition) => {
      if (!isActive) {
        return
      }

      if (definition === null) {
        setDisplay(EMPTY_DISPLAY)
        return
      }

      const choiceLines: { prompt: string; summary: string }[] = []
      const availableChoices = getChoicesAvailableAtLevel(
        definition,
        activeSelection.level,
      )

      for (const choice of availableChoices) {
        const selectedValue = activeSelection.choices[choice.id]

        if (selectedValue === undefined) {
          continue
        }

        if (choice.type === 'single-select' && typeof selectedValue === 'string') {
          const option = choice.options.find(
            (candidate) => candidate.id === selectedValue,
          )

          if (option !== undefined) {
            choiceLines.push(formatChoiceSummary(choice.prompt, [option.label]))
          }
        }

        if (choice.type === 'multi-select' && Array.isArray(selectedValue)) {
          const labels = selectedValue
            .map(
              (optionId) =>
                choice.options.find((candidate) => candidate.id === optionId)
                  ?.label,
            )
            .filter((label): label is string => label !== undefined)

          if (labels.length > 0) {
            choiceLines.push(formatChoiceSummary(choice.prompt, labels))
          }
        }
      }

      setDisplay({
        className: definition.name,
        level: activeSelection.level,
        choiceLines,
      })
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, classDraft, editionId])

  return display
}
