import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { AbilityScores, EditionId } from '../domain/types'
import type {
  CharacterClassSelection,
  CharacterLevel,
  ClassSelection,
} from '../domain/class/types'
import type { BackgroundSelection } from '../domain/background/types'
import type { FeatDefinition } from '../domain/feat/types'
import {
  draftToClassSelection,
  type ClassSelectionDraft,
} from '../features/class/classSelectionDraft'
import {
  validateClassSelection,
  type ClassInstanceValidationError,
  type ClassValidationResult,
} from '../rules/class/classRules'
import { validateCharacterClassesWithDefinitions } from '../rules/class/validateCharacterClasses'

export function useClassStepValidation(
  catalog: ClassCatalog,
  editionId: EditionId,
  committedSelection: ClassSelection | null,
  classDraft: ClassSelectionDraft | null,
  options?: {
    featCatalog?: FeatCatalog
    characterFeatId?: string | null
    committedClasses?: CharacterClassSelection[]
    targetLevel?: CharacterLevel
    startingClassInstanceId?: string | null
    abilityScores?: AbilityScores
    backgroundCatalog?: BackgroundCatalog
    backgroundSelection?: BackgroundSelection | null
  },
) {
  const featCatalog = options?.featCatalog
  const characterFeatId = options?.characterFeatId ?? null
  const committedClasses = options?.committedClasses
  const targetLevel = options?.targetLevel
  const startingClassInstanceId = options?.startingClassInstanceId ?? null
  const abilityScores = options?.abilityScores
  const backgroundCatalog = options?.backgroundCatalog
  const backgroundSelection = options?.backgroundSelection ?? null

  const [classDraftValidation, setClassDraftValidation] =
    useState<ClassValidationResult | null>(null)
  const [committedClassValid, setCommittedClassValid] = useState(false)
  const [multiclassValidationIssues, setMulticlassValidationIssues] = useState<
    ClassInstanceValidationError[]
  >([])

  useEffect(() => {
    if (classDraft === null) {
      setClassDraftValidation(null)
      return
    }

    let isActive = true

    void Promise.all([
      catalog.getClass(classDraft.classId),
      featCatalog?.listFeats(editionId) ?? Promise.resolve([] as FeatDefinition[]),
    ]).then(([definition, feats]) => {
      if (!isActive) {
        return
      }

      const featById =
        featCatalog === undefined
          ? undefined
          : new Map(feats.map((feat) => [feat.id, feat]))

      setClassDraftValidation(
        validateClassSelection(
          draftToClassSelection(classDraft),
          editionId,
          definition,
          {
            featById,
            characterFeatId,
          },
        ),
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, characterFeatId, classDraft, editionId, featCatalog])

  useEffect(() => {
    const classes = committedClasses ?? []

    if (classes.length === 0) {
      setCommittedClassValid(false)
      setMulticlassValidationIssues([])
      return
    }

    if (
      committedSelection === null &&
      (committedClasses === undefined || committedClasses.length === 0)
    ) {
      setCommittedClassValid(false)
      setMulticlassValidationIssues([])
      return
    }

    let isActive = true

    void (async () => {
      const definitions = await Promise.all(
        classes.map(async (instance) => {
          const definition = await catalog.getClass(instance.classId)
          return [instance.classId, definition] as const
        }),
      )
      const definitionById = new Map(
        definitions.map(([classId, definition]) => [classId, definition]),
      )

      const feats =
        featCatalog !== undefined
          ? await featCatalog.listFeats(editionId)
          : ([] as FeatDefinition[])
      const featById =
        featCatalog === undefined
          ? undefined
          : new Map(feats.map((feat) => [feat.id, feat]))

      const backgroundDefinition =
        backgroundCatalog !== undefined && backgroundSelection !== null
          ? await backgroundCatalog.getBackground(
              backgroundSelection.backgroundId,
            )
          : null

      if (!isActive) {
        return
      }

      // Prefer full character-classes validation when we have the full list.
      if (committedClasses !== undefined && targetLevel !== undefined) {
        const characterResult = validateCharacterClassesWithDefinitions(
          {
            classes: committedClasses,
            targetLevel,
            editionId,
            startingClassInstanceId,
            abilityScores,
            backgroundDefinition,
            backgroundSelection,
          },
          (classId) => definitionById.get(classId) ?? null,
        )

        const prereqIssues = characterResult.issues.filter(
          (issue) => issue.code === 'multiclass-ability-prerequisite',
        )
        setMulticlassValidationIssues(prereqIssues)

        // Also require each instance's choice validation with feat context
        // (validateCharacterClasses omits ASI/Epic Boon feat options).
        let allInstancesOk = characterResult.status === 'complete'
        if (allInstancesOk && featById !== undefined) {
          for (const instance of committedClasses) {
            const definition = definitionById.get(instance.classId) ?? null
            const result = validateClassSelection(
              {
                classId: instance.classId,
                level: instance.level,
                choices: instance.choices,
                hitPointIncreases: instance.hitPointIncreases,
              },
              editionId,
              definition,
              {
                featById,
                characterFeatId,
              },
            )
            if (!result.ok) {
              allInstancesOk = false
              break
            }
          }
        }

        setCommittedClassValid(allInstancesOk)
        return
      }

      // Legacy single-selection path
      if (committedSelection === null) {
        setCommittedClassValid(false)
        setMulticlassValidationIssues([])
        return
      }

      const definition =
        definitionById.get(committedSelection.classId) ??
        (await catalog.getClass(committedSelection.classId))

      if (!isActive) {
        return
      }

      setMulticlassValidationIssues([])
      setCommittedClassValid(
        validateClassSelection(committedSelection, editionId, definition, {
          featById,
          characterFeatId,
        }).ok,
      )
    })()

    return () => {
      isActive = false
    }
  }, [
    abilityScores,
    backgroundCatalog,
    backgroundSelection,
    catalog,
    characterFeatId,
    committedClasses,
    committedSelection,
    editionId,
    featCatalog,
    startingClassInstanceId,
    targetLevel,
  ])

  return {
    classDraftValidation,
    committedClassValid,
    multiclassValidationIssues,
  }
}
