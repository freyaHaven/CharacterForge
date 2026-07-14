import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { EditionId } from '../domain/types'
import type { ClassSelection } from '../domain/class/types'
import type { ClassSelectionDraft } from '../features/class/classSelectionDraft'
import type { ClassReviewDisplay } from './reviewSummary'

const EMPTY_DISPLAY: ClassReviewDisplay = {
  className: null,
  fightingStyleLabel: null,
  skillLabels: [],
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

      let fightingStyleLabel: string | null = null
      const skillLabels: string[] = []

      for (const choice of definition.choices) {
        const selectedValue = activeSelection.choices[choice.id]
        if (selectedValue === undefined) {
          continue
        }

        if (choice.type === 'single-select' && typeof selectedValue === 'string') {
          const option = choice.options.find(
            (candidate) => candidate.id === selectedValue,
          )
          if (option !== undefined) {
            if (choice.id === 'fighting-style') {
              fightingStyleLabel = option.label
            }
          }
        }

        if (choice.type === 'multi-select' && Array.isArray(selectedValue)) {
          for (const optionId of selectedValue) {
            const option = choice.options.find(
              (candidate) => candidate.id === optionId,
            )
            if (option !== undefined) {
              skillLabels.push(option.label)
            }
          }
        }
      }

      setDisplay({
        className: definition.name,
        fightingStyleLabel,
        skillLabels,
      })
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, classDraft, editionId])

  return display
}
