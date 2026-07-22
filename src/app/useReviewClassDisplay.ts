import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import { getChoicesAvailableAtLevel } from '../domain/class/choiceAvailability'
import type {
  CharacterClassSelection,
  CharacterLevel,
  ClassChoice,
  ClassChoiceValue,
} from '../domain/class/types'
import type { EditionId } from '../domain/types'
import {
  formatWeaponMasteryDescriptionBody,
  formatWeaponMasteryOptionLabel,
} from '../domain/weapons/mastery'
import { isWeaponId } from '../domain/weapons/types'
import { getSubclassLabelFromDefinition } from '../features/character/getSubclassLabel'
import type { ClassSelectionDrafts } from '../features/class/classSelectionDraft'
import { getSubclassFeaturesUpToLevel } from '../features/class/subclassFeatures'
import {
  collectWeaponMasterySelections,
  isWeaponMasteryChoiceId,
} from '../domain/class/weaponMastery'
import { isFightingStyleFeatGrantChoice } from '../domain/class/fightingStyle'
import type {
  ClassReviewChoiceLine,
  ClassReviewDisplay,
  ClassReviewEntry,
} from './reviewSummary'

const EMPTY_DISPLAY: ClassReviewDisplay = {
  entries: [],
  className: null,
  subclassName: null,
  level: null,
  characterLevel: null,
  choiceLines: [],
}

function isSubclassChoiceId(choiceId: string): boolean {
  return choiceId.endsWith('-subclass')
}

function isWeaponMasteryChoice(choice: ClassChoice): boolean {
  return isWeaponMasteryChoiceId(choice.id)
}

function collectChoiceLines(
  definitionChoices: ReturnType<typeof getChoicesAvailableAtLevel>,
  choices: Record<string, ClassChoiceValue>,
  classLevel: number,
): ClassReviewChoiceLine[] {
  const choiceLines: ClassReviewChoiceLine[] = []
  const masteryWeapons = collectWeaponMasterySelections(choices).filter(isWeaponId)

  if (masteryWeapons.length > 0) {
    choiceLines.push({
      prompt: 'Choose weapon masteries',
      summary: masteryWeapons
        .map((weaponId) => formatWeaponMasteryOptionLabel(weaponId))
        .join(', '),
      heading: 'Weapon Mastery',
      entries: masteryWeapons.map((weaponId) => ({
        label: formatWeaponMasteryOptionLabel(weaponId),
        description: formatWeaponMasteryDescriptionBody(weaponId),
      })),
    })
  }

  for (const choice of definitionChoices) {
    if (isWeaponMasteryChoice(choice)) {
      continue
    }

    const selectedValue = choices[choice.id]
    if (selectedValue === undefined) {
      continue
    }

    if (choice.type === 'single-select' && typeof selectedValue === 'string') {
      // Fighting Style feat grants appear under Feats with source attribution.
      // Class-only alternates (Blessed / Druidic Warrior) stay here.
      if (isFightingStyleFeatGrantChoice(choice)) {
        const alternate = choice.options.find(
          (candidate) => candidate.id === selectedValue,
        )
        if (alternate !== undefined) {
          choiceLines.push({
            prompt: choice.prompt,
            summary: alternate.label,
            heading: alternate.label,
            description: alternate.description,
          })
        }
        continue
      }

      const option = choice.options.find(
        (candidate) => candidate.id === selectedValue,
      )

      if (option === undefined) {
        continue
      }

      if (isSubclassChoiceId(choice.id)) {
        const subclassFeatures = getSubclassFeaturesUpToLevel(option, classLevel)

        if (subclassFeatures.length === 0) {
          continue
        }

        choiceLines.push({
          prompt: choice.prompt,
          summary: option.label,
          heading: option.label,
          entries: subclassFeatures.map((feature) => ({
            label: feature.name,
            description: feature.description,
          })),
        })
        continue
      }

      choiceLines.push({
        prompt: choice.prompt,
        summary: option.label,
      })
      continue
    }

    if (choice.type === 'multi-select' && Array.isArray(selectedValue)) {
      const labels = selectedValue
        .map(
          (optionId) =>
            choice.options.find((candidate) => candidate.id === optionId)?.label,
        )
        .filter((label): label is string => label !== undefined)

      if (labels.length > 0) {
        choiceLines.push({
          prompt: choice.prompt,
          summary: labels.join(', '),
        })
      }
    }
  }

  return choiceLines
}

export function useReviewClassDisplay(
  catalog: ClassCatalog,
  editionId: EditionId,
  committedClasses: readonly CharacterClassSelection[],
  /** Retained for API compatibility; review uses committed classes only. */
  _classDrafts: ClassSelectionDrafts,
  targetLevel: CharacterLevel,
): ClassReviewDisplay {
  const [display, setDisplay] = useState<ClassReviewDisplay>(EMPTY_DISPLAY)

  useEffect(() => {
    if (committedClasses.length === 0) {
      setDisplay(EMPTY_DISPLAY)
      return
    }

    let isActive = true

    void Promise.all(
      committedClasses.map(async (instance) => {
        const definition = await catalog.getClass(instance.classId)
        if (definition === null) {
          return null
        }

        const entry: ClassReviewEntry = {
          classId: definition.id,
          className: definition.name,
          level: instance.level,
          subclassName: getSubclassLabelFromDefinition(
            definition,
            instance.choices,
          ),
        }

        const choiceLines = collectChoiceLines(
          getChoicesAvailableAtLevel(
            definition,
            instance.level,
            instance.choices,
          ),
          instance.choices,
          instance.level,
        )

        return { entry, choiceLines }
      }),
    ).then((resolved) => {
      if (!isActive) {
        return
      }

      const entries: ClassReviewEntry[] = []
      const choiceLines: ClassReviewChoiceLine[] = []

      for (const item of resolved) {
        if (item === null) {
          continue
        }

        entries.push(item.entry)
        choiceLines.push(...item.choiceLines)
      }

      if (entries.length === 0) {
        setDisplay(EMPTY_DISPLAY)
        return
      }

      const primary = entries[0]!

      setDisplay({
        entries,
        className: primary.className,
        subclassName: primary.subclassName,
        level: primary.level,
        characterLevel: targetLevel,
        choiceLines,
      })
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedClasses, editionId, targetLevel])

  return display
}
