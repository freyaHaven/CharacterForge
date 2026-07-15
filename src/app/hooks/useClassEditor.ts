import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { Character } from '../../domain/types'
import type {
  CharacterClassSelection,
  ClassLevel,
  ClassSelection,
} from '../../domain/class/types'
import {
  getAllocatedLevel,
  getEffectiveClassesForCharacterAllocation,
} from '../../domain/character/classLevels'
import {
  classInstanceToSelection,
  removeClassInstanceFromCharacter,
  setCharacterTargetLevel,
  setStartingClassInstanceId,
  upsertClassInstance,
} from '../../domain/character/characterClassSelection'
import { createClassInstanceId } from '../../domain/character/createClassInstanceId'
import {
  clearClassEditorWorkflow,
  loadClassEditorWorkflow,
  saveClassEditorWorkflow,
} from '../session/classEditorWorkflowStorage'
import {
  createClassInstanceDraft,
  createEmptyClassSelectionDrafts,
  getLegacyDraftForInstance,
  isAnyClassDraftIncomplete,
  removeInstanceDraft,
  setLegacyDraftForInstance,
  tryCommitClassInstanceDraft,
  type ClassSelectionDraft,
  type ClassSelectionDrafts,
} from '../../features/class/classSelectionDraft'
import {
  getEffectiveClassInstances,
  getUniqueClassIds,
  inferInitialBuildMode,
  type ClassBuildMode,
} from '../../features/class/classBuildMode'
import { useClassStepValidation } from '../useClassStepValidation'

type UseClassEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  classCatalog: ClassCatalog
  onDraftChange?: () => void
}

function findInstanceIdForClassId(
  classes: CharacterClassSelection[],
  drafts: ClassSelectionDrafts,
  classId: string,
): string | null {
  const committed = classes.find((entry) => entry.classId === classId)

  if (committed !== undefined) {
    return committed.instanceId
  }

  for (const [instanceId, draft] of Object.entries(drafts)) {
    if (draft.classId === classId) {
      return instanceId
    }
  }

  return null
}

function syncTargetLevelFromInstances(
  character: Character,
  classDrafts: ClassSelectionDrafts,
): Character {
  const instances = getEffectiveClassesForCharacterAllocation(
    character.classes,
    classDrafts,
  )
  const total = Math.max(1, getAllocatedLevel(instances))

  return setCharacterTargetLevel(character, total as ClassLevel)
}

export function useClassEditor({
  character,
  setCharacter,
  classCatalog,
  onDraftChange,
}: UseClassEditorOptions) {
  const [classDrafts, setClassDrafts] = useState<ClassSelectionDrafts>(
    createEmptyClassSelectionDrafts(),
  )
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null,
  )
  const [buildMode, setBuildModeState] = useState<ClassBuildMode | null>(null)
  const selectedInstanceIdRef = useRef<string | null>(null)
  const hydratedCharacterIdRef = useRef<string | null>(null)

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const resetClassDraft = useCallback(() => {
    setClassDrafts(createEmptyClassSelectionDrafts())
    setSelectedInstanceId(null)
    selectedInstanceIdRef.current = null
    setBuildModeState(null)
    if (hydratedCharacterIdRef.current !== null) {
      clearClassEditorWorkflow(hydratedCharacterIdRef.current)
    }
  }, [])

  const hydrateForCharacter = useCallback((character: Character) => {
    hydratedCharacterIdRef.current = character.id
    const storedWorkflow = loadClassEditorWorkflow(character.id)

    if (storedWorkflow !== null) {
      setBuildModeState(storedWorkflow.buildMode)
      setClassDrafts(storedWorkflow.classDrafts)
      setSelectedInstanceId(storedWorkflow.selectedInstanceId)
      selectedInstanceIdRef.current = storedWorkflow.selectedInstanceId
      return
    }

    setClassDrafts(createEmptyClassSelectionDrafts())
    setSelectedInstanceId(null)
    selectedInstanceIdRef.current = null
    setBuildModeState(
      inferInitialBuildMode(character.classes, createEmptyClassSelectionDrafts()),
    )
  }, [])

  useEffect(() => {
    const hasClassProgress =
      buildMode !== null ||
      character.classes.length > 0 ||
      Object.keys(classDrafts).length > 0

    if (!hasClassProgress) {
      return
    }

    saveClassEditorWorkflow(character.id, {
      buildMode,
      classDrafts,
      selectedInstanceId: selectedInstanceIdRef.current ?? selectedInstanceId,
    })
  }, [buildMode, character.classes.length, character.id, classDrafts, selectedInstanceId])

  const activeInstanceId = useMemo(() => {
    if (selectedInstanceId !== null) {
      const hasCommitted = character.classes.some(
        (instance) => instance.instanceId === selectedInstanceId,
      )
      const hasDraft = selectedInstanceId in classDrafts

      if (hasCommitted || hasDraft) {
        return selectedInstanceId
      }
    }

    return (
      character.startingClassInstanceId ??
      character.classes[0]?.instanceId ??
      Object.keys(classDrafts)[0] ??
      null
    )
  }, [character.classes, character.startingClassInstanceId, classDrafts, selectedInstanceId])

  const setActiveInstanceId = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId)
    selectedInstanceIdRef.current = instanceId
  }, [])

  const classDraft = useMemo(
    () => getLegacyDraftForInstance(classDrafts, activeInstanceId),
    [activeInstanceId, classDrafts],
  )

  const committedInstance = useMemo(
    () =>
      character.classes.find(
        (instance) => instance.instanceId === activeInstanceId,
      ) ?? null,
    [activeInstanceId, character.classes],
  )

  const committedSelection = useMemo((): ClassSelection | null => {
    if (committedInstance === null) {
      return null
    }

    return classInstanceToSelection(committedInstance)
  }, [
    committedInstance?.classId,
    committedInstance?.level,
    committedInstance?.choices,
  ])

  const { classDraftValidation, committedClassValid } = useClassStepValidation(
    classCatalog,
    character.editionId,
    committedSelection,
    classDraft,
  )

  const classDraftIncomplete = isAnyClassDraftIncomplete(
    classDrafts,
    character.classes,
  )

  const setBuildMode = useCallback((mode: ClassBuildMode) => {
    setBuildModeState(mode)
  }, [])

  const returnToClassPathIntro = useCallback(() => {
    setBuildModeState(null)
  }, [])

  const setClassDraft = useCallback(
    (draft: ClassSelectionDraft | null) => {
      const resolvedInstanceId =
        activeInstanceId ?? selectedInstanceIdRef.current

      if (draft === null) {
        if (resolvedInstanceId !== null) {
          setClassDrafts((current) =>
            removeInstanceDraft(current, resolvedInstanceId),
          )
        }
        return
      }

      const instanceId = resolvedInstanceId ?? createClassInstanceId()

      if (resolvedInstanceId === null) {
        setSelectedInstanceId(instanceId)
        selectedInstanceIdRef.current = instanceId
      }

      setClassDrafts((current) => {
        const next = setLegacyDraftForInstance(current, instanceId, draft)

        if (buildMode === 'multiclass') {
          setCharacter((currentCharacter) =>
            syncTargetLevelFromInstances(currentCharacter, next),
          )
        }

        return next
      })
    },
    [activeInstanceId, buildMode, setCharacter],
  )

  const commitClassInstance = useCallback(
    (instance: CharacterClassSelection) => {
      setCharacter((current) => {
        let next =
          buildMode === 'single-class'
            ? {
                ...current,
                targetLevel: instance.level,
                classes: [instance],
                startingClassInstanceId: instance.instanceId,
              }
            : upsertClassInstance(current, instance)

        if (buildMode === 'multiclass') {
          next = syncTargetLevelFromInstances(next, classDrafts)
        }

        return next
      })
      setClassDrafts((current) => removeInstanceDraft(current, instance.instanceId))

      if (
        selectedInstanceIdRef.current === null ||
        selectedInstanceIdRef.current === instance.instanceId
      ) {
        setSelectedInstanceId(instance.instanceId)
        selectedInstanceIdRef.current = instance.instanceId
      }

      notifyDraftChange()
    },
    [buildMode, classDrafts, notifyDraftChange, setCharacter],
  )

  const tryCommitDraftInstance = useCallback(
    async (instanceId: string | null) => {
      if (instanceId === null) {
        return
      }

      const draft = classDrafts[instanceId]

      if (draft === undefined) {
        return
      }

      if (character.classes.some((entry) => entry.instanceId === instanceId)) {
        return
      }

      const definition = await classCatalog.getClass(draft.classId)
      const { committed } = tryCommitClassInstanceDraft(
        draft,
        character.editionId,
        definition,
      )

      if (committed !== null) {
        commitClassInstance(committed)
      }
    },
    [
      character.classes,
      character.editionId,
      classCatalog,
      classDrafts,
      commitClassInstance,
    ],
  )

  const commitClassSelection = useCallback(
    (classSelection: ClassSelection | null) => {
      if (classSelection === null) {
        setCharacter((current) => ({
          ...current,
          targetLevel: 1,
          classes: [],
          startingClassInstanceId: null,
        }))
        setClassDrafts(createEmptyClassSelectionDrafts())
        setSelectedInstanceId(null)
        selectedInstanceIdRef.current = null
        notifyDraftChange()
        return
      }

      const instanceId = activeInstanceId ?? createClassInstanceId()
      commitClassInstance({
        instanceId,
        classId: classSelection.classId,
        level: classSelection.level,
        choices: { ...classSelection.choices },
      })
    },
    [activeInstanceId, commitClassInstance, notifyDraftChange, setCharacter],
  )

  const removeClassInstance = useCallback(
    (instanceId: string) => {
      setCharacter((current) => {
        let next = removeClassInstanceFromCharacter(current, instanceId)

        if (buildMode === 'multiclass') {
          next = syncTargetLevelFromInstances(next, classDrafts)
        }

        if (buildMode === 'single-class' && next.classes.length === 0) {
          next = {
            ...next,
            targetLevel: 1,
            startingClassInstanceId: null,
          }
        }

        return next
      })
      setClassDrafts((current) => {
        const next = removeInstanceDraft(current, instanceId)

        if (buildMode === 'multiclass') {
          setCharacter((currentCharacter) =>
            syncTargetLevelFromInstances(currentCharacter, next),
          )
        }

        return next
      })
      setSelectedInstanceId((current) => (current === instanceId ? null : current))
      if (selectedInstanceIdRef.current === instanceId) {
        selectedInstanceIdRef.current = null
      }
      notifyDraftChange()
    },
    [buildMode, classDrafts, notifyDraftChange, setCharacter],
  )

  const setStartingClass = useCallback(
    (instanceId: string) => {
      setCharacter((current) => setStartingClassInstanceId(current, instanceId))
      setSelectedInstanceId(instanceId)
      selectedInstanceIdRef.current = instanceId

      for (const draftInstanceId of Object.keys(classDrafts)) {
        void tryCommitDraftInstance(draftInstanceId)
      }

      notifyDraftChange()
    },
    [classDrafts, notifyDraftChange, setCharacter, tryCommitDraftInstance],
  )

  const selectOrAddClass = useCallback(
    (classId: string): string => {
      const existingInstanceId = findInstanceIdForClassId(
        character.classes,
        classDrafts,
        classId,
      )

      if (existingInstanceId !== null) {
        setSelectedInstanceId(existingInstanceId)
        selectedInstanceIdRef.current = existingInstanceId
        return existingInstanceId
      }

      const instanceId = createClassInstanceId()
      setClassDrafts((current) => ({
        ...current,
        [instanceId]: createClassInstanceDraft(instanceId, classId),
      }))
      setSelectedInstanceId(instanceId)
      selectedInstanceIdRef.current = instanceId

      if (buildMode === 'single-class') {
        setCharacter((current) => ({
          ...current,
          classes: [],
          startingClassInstanceId: null,
          targetLevel: 1,
        }))
      }

      return instanceId
    },
    [buildMode, character.classes, classDrafts, setCharacter],
  )

  const setMulticlassInstanceLevel = useCallback(
    (instanceId: string, level: ClassLevel) => {
      const committed = character.classes.find(
        (instance) => instance.instanceId === instanceId,
      )
      const draft = classDrafts[instanceId]

      if (committed !== undefined) {
        const updated = { ...committed, level }
        setCharacter((current) => {
          const next = upsertClassInstance(current, updated)
          return syncTargetLevelFromInstances(next, classDrafts)
        })
      } else if (draft !== undefined) {
        setClassDrafts((current) => ({
          ...current,
          [instanceId]: { ...draft, level },
        }))
        setCharacter((current) =>
          syncTargetLevelFromInstances(current, {
            ...classDrafts,
            [instanceId]: { ...draft, level },
          }),
        )
      }

      notifyDraftChange()
    },
    [character.classes, classDrafts, notifyDraftChange, setCharacter],
  )

  const toggleMulticlassClass = useCallback(
    (classId: string): 'added' | 'removed' | 'blocked' => {
      const existingInstanceId = findInstanceIdForClassId(
        character.classes,
        classDrafts,
        classId,
      )

      if (existingInstanceId !== null) {
        const committed = character.classes.find(
          (instance) => instance.instanceId === existingInstanceId,
        )
        const draft = classDrafts[existingInstanceId]
        const instance =
          committed ??
          (draft === undefined
            ? null
            : {
                instanceId: existingInstanceId,
                classId: draft.classId,
                level: draft.level,
                choices: { ...draft.choices },
              })

        if (instance !== null && Object.keys(instance.choices).length > 0) {
          return 'blocked'
        }

        removeClassInstance(existingInstanceId)
        return 'removed'
      }

      const instanceId = createClassInstanceId()
      setClassDrafts((current) => {
        const next = {
          ...current,
          [instanceId]: createClassInstanceDraft(instanceId, classId),
        }
        setCharacter((currentCharacter) =>
          syncTargetLevelFromInstances(currentCharacter, next),
        )
        return next
      })
      setSelectedInstanceId(instanceId)
      selectedInstanceIdRef.current = instanceId
      notifyDraftChange()
      void tryCommitDraftInstance(instanceId)
      return 'added'
    },
    [
      character.classes,
      classDrafts,
      notifyDraftChange,
      removeClassInstance,
      setCharacter,
      tryCommitDraftInstance,
    ],
  )

  const switchToMulticlass = useCallback(() => {
    setBuildModeState('multiclass')

    const instances = getEffectiveClassInstances(character.classes, classDrafts)

    if (instances.length === 1) {
      setCharacter((current) =>
        setStartingClassInstanceId(current, instances[0].instanceId),
      )
    } else if (character.classes.length === 1) {
      setCharacter((current) =>
        setStartingClassInstanceId(current, character.classes[0].instanceId),
      )
    }

    setCharacter((current) => syncTargetLevelFromInstances(current, classDrafts))
    notifyDraftChange()
  }, [character.classes, classDrafts, notifyDraftChange, setCharacter])

  const switchToSingleClass = useCallback(
    (retainInstanceId: string) => {
      const instances = getEffectiveClassInstances(character.classes, classDrafts)
      const retained = instances.find(
        (instance) => instance.instanceId === retainInstanceId,
      )

      if (retained === undefined) {
        return
      }

      setCharacter((current) => ({
        ...current,
        targetLevel: retained.level,
        classes: [retained],
        startingClassInstanceId: retained.instanceId,
      }))
      setClassDrafts(createEmptyClassSelectionDrafts())
      setSelectedInstanceId(retained.instanceId)
      selectedInstanceIdRef.current = retained.instanceId
      setBuildModeState('single-class')
      notifyDraftChange()
    },
    [character.classes, classDrafts, notifyDraftChange, setCharacter],
  )

  const uniqueClassCount = getUniqueClassIds(character.classes, classDrafts).length

  const syncTargetLevel = useCallback(
    (level: ClassLevel) => {
      setCharacter((current) => setCharacterTargetLevel(current, level))
      notifyDraftChange()
    },
    [notifyDraftChange, setCharacter],
  )

  return {
    classDrafts,
    classDraft,
    setClassDraft,
    classDraftIncomplete,
    classDraftValidation,
    committedClassValid,
    resetClassDraft,
    hydrateForCharacter,
    commitClassSelection,
    commitClassInstance,
    committedSelection,
    activeInstanceId,
    setActiveInstanceId,
    committedInstance,
    committedClasses: character.classes,
    targetLevel: character.targetLevel,
    startingClassInstanceId: character.startingClassInstanceId,
    setStartingClass,
    removeClassInstance,
    selectOrAddClass,
    buildMode,
    setBuildMode,
    returnToClassPathIntro,
    switchToMulticlass,
    switchToSingleClass,
    toggleMulticlassClass,
    setMulticlassInstanceLevel,
    uniqueClassCount,
    syncTargetLevel,
  }
}
