import { useEffect, useMemo, useRef, useState } from 'react'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type {
  CharacterClassSelection,
  ClassChoiceValue,
  ClassDefinition,
} from '../../domain/class/types'
import { MAX_CLASS_LEVEL } from '../../domain/class/types'
import { classInstanceToSelection } from '../../domain/character/characterClassSelection'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeatureProgressionUpToLevel } from '../../domain/class/featureProgression'
import { createClassChoiceStateKey } from './classChoiceStateKeys'
import {
  pruneFeatureChoiceExpansionState,
  type FeatureChoiceExpansionState,
} from '../choices/featureChoiceExpansionState'
import { ClassCatalogCard } from './ClassCatalogCard'
import { ClassInstanceConfigurator } from './ClassInstanceConfigurator'
import { SingleClassConfigurator } from './SingleClassConfigurator'
import { ClassModeSwitchDialog } from './ClassModeSwitchDialog'
import { ClassPathControl } from './ClassPathControl'
import { ClassPathIntro } from './ClassPathIntro'
import { StartingClassPicker } from './ClassMulticlassControls'
import {
  deriveMulticlassStage,
  filterCatalogForBuildMode,
  formatMulticlassLevelSummary,
  getEffectiveClassInstances,
  getUniqueClassIds,
  isPreviewClassDefinition,
  type ClassBuildMode,
} from './classBuildMode'
import { getAllocatedLevel } from '../../domain/character/classLevels'
import {
  MulticlassConfigureTabs,
  MulticlassLevelAllocation,
} from './MulticlassWorkflowControls'
import { sortClassesForCatalog } from './sortClassesForCatalog'
import {
  createClassSelectionDraft,
  instanceDraftToLegacyDraft,
  initializeClassInstanceDraft,
  legacyDraftToInstanceDraft,
  tryCommitClassInstanceDraft,
  updateClassDraftChoice,
  updateClassDraftLevel,
  type ClassSelectionDraft,
  type ClassSelectionDrafts,
} from './classSelectionDraft'

type ClassPickerProps = {
  editionId: EditionId
  buildMode: ClassBuildMode | null
  targetLevel: number
  committedClasses: CharacterClassSelection[]
  classDrafts: ClassSelectionDrafts
  startingClassInstanceId: string | null
  activeInstanceId: string | null
  draft: ClassSelectionDraft | null
  catalog: ClassCatalog
  featCatalog: FeatCatalog
  characterFeatId?: string | null
  onBuildModeChange: (mode: ClassBuildMode) => void
  onReturnToClassPathIntro: () => void
  onSwitchToMulticlass: () => void
  onSwitchToSingleClass: (retainInstanceId: string) => void
  onSyncTargetLevel: (level: number) => void
  onActiveInstanceChange: (instanceId: string) => void
  onDraftChange: (draft: ClassSelectionDraft | null) => void
  onCommitInstance: (instance: CharacterClassSelection) => void
  onRemoveInstance: (instanceId: string) => void
  onStartingClassChange: (instanceId: string) => void
  onSelectOrAddClass: (classDefinition: ClassDefinition) => string
  onToggleMulticlassClass: (classId: string) => 'added' | 'removed' | 'blocked'
  onMulticlassInstanceLevelChange: (instanceId: string, level: number) => void
}

type PendingModeSwitch =
  | { kind: 'to-multiclass' }
  | { kind: 'to-single'; retainInstanceId: string }

function getFeatureLinkedChoiceStateKeys(
  instanceId: string,
  definition: ClassDefinition,
  level: number,
): string[] {
  const availableChoices = getChoicesAvailableAtLevel(definition, level)
  const featureIds = getClassFeatureProgressionUpToLevel(definition, level)
    .flatMap((entry) => entry.features)
    .map((feature) => feature.id)

  return availableChoices
    .filter(
      (choice) =>
        choice.type === 'single-select' && featureIds.includes(choice.id),
    )
    .map((choice) => createClassChoiceStateKey(instanceId, choice.id))
}

export function ClassPicker({
  editionId,
  buildMode,
  targetLevel: _targetLevel,
  committedClasses,
  classDrafts,
  startingClassInstanceId,
  activeInstanceId,
  draft,
  catalog,
  featCatalog,
  characterFeatId = null,
  onBuildModeChange,
  onReturnToClassPathIntro,
  onSwitchToMulticlass,
  onSwitchToSingleClass,
  onSyncTargetLevel,
  onActiveInstanceChange,
  onDraftChange,
  onCommitInstance,
  onRemoveInstance: _onRemoveInstance,
  onStartingClassChange,
  onSelectOrAddClass,
  onToggleMulticlassClass,
  onMulticlassInstanceLevelChange,
}: ClassPickerProps) {
  const [classList, setClassList] = useState<ClassDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setChoiceExpansionState] =
    useState<FeatureChoiceExpansionState>({})
  const [pendingModeSwitch, setPendingModeSwitch] =
    useState<PendingModeSwitch | null>(null)
  const [toggleBlockedMessage, setToggleBlockedMessage] = useState<string | null>(
    null,
  )
  const activeInstanceRef = useRef<string | null>(activeInstanceId)

  if (activeInstanceId !== null) {
    activeInstanceRef.current = activeInstanceId
  }

  function resolveActiveInstanceId(): string | null {
    return activeInstanceId ?? activeInstanceRef.current
  }

  const effectiveInstances = useMemo(
    () => getEffectiveClassInstances(committedClasses, classDrafts),
    [committedClasses, classDrafts],
  )

  const selectedClassIds = useMemo(
    () => new Set(getUniqueClassIds(committedClasses, classDrafts)),
    [committedClasses, classDrafts],
  )

  const committedInstance =
    committedClasses.find(
      (instance) => instance.instanceId === activeInstanceId,
    ) ?? null
  const committedSelection =
    committedInstance === null ? null : classInstanceToSelection(committedInstance)

  const activeClassId = draft?.classId ?? committedSelection?.classId ?? null
  const activeChoices = draft?.choices ?? committedSelection?.choices ?? {}
  const activeLevel = draft?.level ?? committedSelection?.level ?? 1

  const activeDefinition =
    activeClassId === null
      ? null
      : (classList.find((entry) => entry.id === activeClassId) ?? null)

  const catalogClasses = useMemo(() => {
    const sorted = sortClassesForCatalog(classList)

    if (buildMode === null || buildMode === 'multiclass') {
      return sorted
    }

    return filterCatalogForBuildMode(sorted, buildMode)
  }, [buildMode, classList])

  const classNamesById = useMemo(
    () => new Map(classList.map((definition) => [definition.id, definition.name])),
    [classList],
  )

  const multiclassStage =
    buildMode === 'multiclass'
      ? deriveMulticlassStage(
          committedClasses,
          classDrafts,
          startingClassInstanceId,
        )
      : null

  const configureInstanceEntries = useMemo(
    () =>
      effectiveInstances.map((instance) => ({
        instanceId: instance.instanceId,
        className: classNamesById.get(instance.classId) ?? instance.classId,
        level: instance.level,
      })),
    [classNamesById, effectiveInstances],
  )

  const startingClassOptions = useMemo(
    () =>
      effectiveInstances.map((instance) => ({
        instanceId: instance.instanceId,
        className: classNamesById.get(instance.classId) ?? instance.classId,
      })),
    [classNamesById, effectiveInstances],
  )

  const retainClassOptions = useMemo(
    () =>
      effectiveInstances.map((instance) => ({
        instanceId: instance.instanceId,
        className: classNamesById.get(instance.classId) ?? instance.classId,
      })),
    [classNamesById, effectiveInstances],
  )

  const maxInstanceLevel =
    buildMode === 'single-class' ? MAX_CLASS_LEVEL : MAX_CLASS_LEVEL

  useEffect(() => {
    let isActive = true
    setIsLoading(true)

    void catalog.listClasses(editionId).then((classes) => {
      if (!isActive) {
        return
      }

      setClassList(classes)
      setIsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId])

  useEffect(() => {
    if (
      buildMode === 'multiclass' &&
      multiclassStage === 'configure' &&
      activeInstanceId === null &&
      effectiveInstances[0] !== undefined
    ) {
      onActiveInstanceChange(effectiveInstances[0].instanceId)
    }
  }, [
    activeInstanceId,
    buildMode,
    effectiveInstances,
    multiclassStage,
    onActiveInstanceChange,
  ])

  async function commitDraft(
    nextDraft: ClassSelectionDraft,
    instanceId: string | null = resolveActiveInstanceId(),
  ) {
    if (instanceId === null) {
      return
    }

    const definition = await catalog.getClass(nextDraft.classId)
    const instanceDraft = legacyDraftToInstanceDraft(nextDraft, instanceId)
    const { committed } = tryCommitClassInstanceDraft(
      instanceDraft,
      editionId,
      definition,
    )

    if (committed !== null) {
      onDraftChange(null)
      onCommitInstance(committed)
      return
    }

    onDraftChange(nextDraft)
  }

  function ensureDraft(): ClassSelectionDraft | null {
    if (draft !== null) {
      return draft
    }

    if (activeClassId === null) {
      return null
    }

    if (activeInstanceId === null) {
      return {
        classId: activeClassId,
        level: activeLevel,
        choices: activeChoices,
      }
    }

    return instanceDraftToLegacyDraft(
      initializeClassInstanceDraft({
        instanceId: activeInstanceId,
        classId: activeClassId,
        level: activeLevel,
        choices: activeChoices,
      }),
    )
  }

  async function selectSingleClass(classDefinition: ClassDefinition) {
    setChoiceExpansionState({})
    const instanceId = onSelectOrAddClass(classDefinition)
    activeInstanceRef.current = instanceId
    onActiveInstanceChange(instanceId)

    const nextDraft = createClassSelectionDraft(classDefinition.id)
    const instanceDraft = legacyDraftToInstanceDraft(nextDraft, instanceId)
    const { committed } = tryCommitClassInstanceDraft(
      instanceDraft,
      editionId,
      classDefinition,
    )

    if (committed !== null) {
      onDraftChange(null)
      onCommitInstance(committed)
      return
    }

    await commitDraft(nextDraft, instanceId)
  }

  function handleMulticlassCatalogToggle(classDefinition: ClassDefinition) {
    setToggleBlockedMessage(null)
    const result = onToggleMulticlassClass(classDefinition.id)

    if (result === 'blocked') {
      setToggleBlockedMessage(
        `Clear ${classDefinition.name} choices before removing it from your build.`,
      )
      return
    }

    if (result === 'added') {
      setChoiceExpansionState({})
    }
  }

  async function handleChoiceChange(
    choiceId: string,
    value: ClassChoiceValue | undefined,
  ) {
    const currentDraft = ensureDraft()

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateClassDraftChoice(currentDraft, choiceId, value)
    await commitDraft(nextDraft)
  }

  async function handleLevelChange(level: number) {
    if (activeDefinition === null) {
      return
    }

    const instanceId = resolveActiveInstanceId()

    if (instanceId === null) {
      return
    }

    const clampedLevel = Math.min(level, maxInstanceLevel)

    if (buildMode === 'single-class') {
      onSyncTargetLevel(clampedLevel)
    }

    const currentDraft = ensureDraft()

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateClassDraftLevel(
      currentDraft,
      clampedLevel,
      activeDefinition,
    )

    setChoiceExpansionState((current) =>
      pruneFeatureChoiceExpansionState(
        current,
        getFeatureLinkedChoiceStateKeys(
          instanceId,
          activeDefinition,
          clampedLevel,
        ),
      ),
    )

    await commitDraft(nextDraft, instanceId)
  }

  function handlePathSelect(nextMode: ClassBuildMode) {
    handleBuildModeRequest(nextMode)
  }

  function handleBuildModeRequest(nextMode: ClassBuildMode) {
    if (buildMode === nextMode) {
      return
    }

    const uniqueClassCount = selectedClassIds.size

    if (nextMode === 'multiclass') {
      if (uniqueClassCount === 1) {
        setPendingModeSwitch({ kind: 'to-multiclass' })
        return
      }

      onBuildModeChange('multiclass')
      onSwitchToMulticlass()
      return
    }

    if (uniqueClassCount > 1) {
      setPendingModeSwitch({
        kind: 'to-single',
        retainInstanceId:
          startingClassInstanceId ??
          effectiveInstances[0]?.instanceId ??
          '',
      })
      return
    }

    if (uniqueClassCount === 1) {
      if (buildMode === null) {
        onBuildModeChange('single-class')
        return
      }

      onSwitchToSingleClass(effectiveInstances[0].instanceId)
      return
    }

    onBuildModeChange('single-class')
  }

  function confirmModeSwitch() {
    if (pendingModeSwitch === null) {
      return
    }

    if (pendingModeSwitch.kind === 'to-multiclass') {
      onBuildModeChange('multiclass')
      onSwitchToMulticlass()
    } else {
      onSwitchToSingleClass(pendingModeSwitch.retainInstanceId)
    }

    setPendingModeSwitch(null)
  }

  return (
    <section className="class-picker" aria-labelledby="class-picker-heading">
      {buildMode === null ? (
        <>
          <h2 id="class-picker-heading">Class</h2>
          <ClassPathIntro onSelect={handlePathSelect} />
        </>
      ) : (
        <>
          <ClassPathControl
            buildMode={buildMode}
            onChangePath={onReturnToClassPathIntro}
          />

          {isLoading ? <p className="status">Loading classes...</p> : null}

          {!isLoading && classList.length === 0 ? (
            <p className="status">
              No bundled classes are available for this rules edition yet.
            </p>
          ) : null}

          {!isLoading && classList.length > 0 ? (
            <>
              {buildMode === 'single-class' ? (
                <>
                  <ul
                    id="class-catalog-list"
                    className="class-picker__catalog"
                    role="list"
                  >
                    {catalogClasses.map((classDefinition) => (
                      <ClassCatalogCard
                        key={classDefinition.id}
                        classDefinition={classDefinition}
                        isSelected={activeClassId === classDefinition.id}
                        onSelect={selectSingleClass}
                      />
                    ))}
                  </ul>

                  {activeDefinition !== null ? (
                    <SingleClassConfigurator
                      editionId={editionId}
                      activeInstanceId={activeInstanceId}
                      activeDefinition={activeDefinition}
                      activeClassId={activeClassId ?? activeDefinition.id}
                      activeLevel={activeLevel}
                      activeChoices={activeChoices}
                      maxInstanceLevel={maxInstanceLevel}
                      draft={draft}
                      committedSelection={committedSelection}
                      featCatalog={featCatalog}
                      characterFeatId={characterFeatId}
                      onLevelChange={(level) => {
                        void handleLevelChange(level)
                      }}
                      onChoiceChange={(choiceId, value) => {
                        void handleChoiceChange(choiceId, value)
                      }}
                    />
                  ) : null}
                </>
              ) : null}

              {buildMode === 'multiclass' ? (
                <>
                  <h2 className="class-picker__path-heading">Multiclass</h2>

                  {multiclassStage === 'select-classes' ? (
                    <section
                      className="class-picker__multiclass-stage"
                      aria-labelledby="multiclass-select-heading"
                    >
                      <p
                        id="multiclass-select-heading"
                        className="helper-text"
                      >
                        Select at least two different classes. Click a selected
                        class again to remove it if it has no configured choices.
                      </p>
                      {selectedClassIds.size > 0 ? (
                        <ul className="class-picker__selected-classes" role="list">
                          {catalogClasses
                            .filter((definition) =>
                              selectedClassIds.has(definition.id),
                            )
                            .map((definition) => (
                              <li key={definition.id}>✓ {definition.name}</li>
                            ))}
                        </ul>
                      ) : null}
                      {toggleBlockedMessage !== null ? (
                        <p className="validation-message" role="alert">
                          {toggleBlockedMessage}
                        </p>
                      ) : null}
                      <ul
                        id="class-catalog-list"
                        className="class-picker__catalog"
                        role="list"
                      >
                        {catalogClasses.map((classDefinition) => (
                          <ClassCatalogCard
                            key={classDefinition.id}
                            classDefinition={classDefinition}
                            isSelected={selectedClassIds.has(classDefinition.id)}
                            isPreview={isPreviewClassDefinition(classDefinition)}
                            onSelect={handleMulticlassCatalogToggle}
                          />
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {multiclassStage === 'allocate-levels' ||
                  multiclassStage === 'starting-class' ? (
                    <MulticlassLevelAllocation
                      instances={effectiveInstances}
                      classNamesById={classNamesById}
                      onLevelChange={onMulticlassInstanceLevelChange}
                    />
                  ) : null}

                  {multiclassStage === 'starting-class' ? (
                    <StartingClassPicker
                      instances={startingClassOptions}
                      startingClassInstanceId={startingClassInstanceId}
                      onStartingClassChange={onStartingClassChange}
                    />
                  ) : null}

                  {multiclassStage === 'configure' ? (
                    <>
                      <p
                        className="class-picker__allocation-summary"
                        aria-live="polite"
                      >
                        {formatMulticlassLevelSummary(
                          effectiveInstances,
                          classNamesById,
                        )}
                      </p>
                      <p className="class-picker__character-level">
                        Character level: {getAllocatedLevel(effectiveInstances)}
                      </p>

                      <MulticlassConfigureTabs
                        instances={configureInstanceEntries}
                        activeInstanceId={activeInstanceId}
                        onSelectInstance={onActiveInstanceChange}
                      />

                      {activeDefinition !== null ? (
                        <ClassInstanceConfigurator
                          editionId={editionId}
                          activeInstanceId={activeInstanceId}
                          activeDefinition={activeDefinition}
                          activeClassId={activeClassId ?? activeDefinition.id}
                          activeLevel={activeLevel}
                          activeChoices={activeChoices}
                          maxInstanceLevel={MAX_CLASS_LEVEL}
                          draft={draft}
                          committedSelection={committedSelection}
                          featCatalog={featCatalog}
                          characterFeatId={characterFeatId}
                          onLevelChange={(level) => {
                            void handleLevelChange(level)
                          }}
                          onChoiceChange={(choiceId, value) => {
                            void handleChoiceChange(choiceId, value)
                          }}
                        />
                      ) : (
                        <div
                          className="class-picker__detail class-picker__detail--placeholder"
                          aria-hidden="true"
                        >
                          <p>Select a class tab to configure its choices.</p>
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}

      <ClassModeSwitchDialog
        open={pendingModeSwitch !== null}
        mode={
          pendingModeSwitch?.kind === 'to-single' ? 'to-single' : 'to-multiclass'
        }
        classOptions={retainClassOptions}
        retainInstanceId={
          pendingModeSwitch?.kind === 'to-single'
            ? pendingModeSwitch.retainInstanceId
            : null
        }
        onRetainInstanceChange={(instanceId) => {
          setPendingModeSwitch({ kind: 'to-single', retainInstanceId: instanceId })
        }}
        onConfirm={confirmModeSwitch}
        onCancel={() => {
          setPendingModeSwitch(null)
        }}
      />
    </section>
  )
}
