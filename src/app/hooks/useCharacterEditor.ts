import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadCharacterFile } from '../../adapters/characterFile'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createCharacterId } from '../../domain/character/createCharacterId'
import { migrateLegacyCharacterDetails } from '../../domain/character/migrateCharacterDetails'
import type { CharacterRepository } from '../../domain/ports/characterRepository'
import type { Character, CharacterDetails } from '../../domain/types'
import { getActiveCharacterId, setActiveCharacterId } from '../session/editorSession'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { SpellCatalog } from '../../domain/ports/spellCatalog'
import type { EquipmentCatalog } from '../../domain/ports/equipmentCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
import { createBundledSpellCatalog } from '../../adapters/bundledSpellCatalog'
import { createBundledEquipmentCatalog } from '../../adapters/bundledEquipmentCatalog'
import { buildCharacterForSave } from '../buildCharacterForSave'
import {
  canSaveCharacter,
  formatSaveBlockedMessage,
} from '../characterSavePolicy'
import {
  formatFinishBlockedMessage,
  getFinishPolicyResult,
} from '../characterFinishPolicy'
import {
  buildReviewSummaries,
  buildCharacterDetailsReviewSections,
  getReviewableStepIds,
} from '../reviewSummary'
import { createWizardStepContext } from '../wizard/stepVisibility'
import { useDeferredCharacterRequirements } from '../useDeferredCharacterRequirements'
import { useReviewClassDisplay } from '../useReviewClassDisplay'
import { useReviewBackgroundDisplay } from '../useReviewBackgroundDisplay'
import { useReviewFeatDisplay } from '../useReviewFeatDisplay'
import { useReviewSpeciesDisplay } from '../useReviewSpeciesDisplay'
import { useReviewSpellcasting } from '../useReviewSpellcasting'
import { useSpellsStepValidation } from '../useSpellsStepValidation'
import { useEquipmentResolution } from '../useEquipmentResolution'
import { useReviewSheetModels } from '../useReviewSheetModels'
import { pruneInactiveSpellSourceStates } from '../../rules/spell/pruneInactiveSpellSourceStates'
import { prunePreparedSpellsNotInSpellbook } from '../../rules/spell/prunePreparedSpellsNotInSpellbook'
import { pruneSpellsNotOnEntitlementList } from '../../rules/spell/pruneSpellsNotOnEntitlementList'
import { pruneInactiveEquipmentSelections } from '../../rules/equipment/pruneInactiveEquipmentSelections'
import { collectActiveEquipmentSelectionKeysForDefinition } from '../../domain/equipment/equipmentChoiceTree'
import type { SpellSourceState } from '../../domain/spell/types'
import type {
  EquipmentItemDefinition,
  EquipmentLoadout,
  EquipmentSelection,
  InventoryLocation,
} from '../../domain/equipment/types'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../domain/equipment/types'
import { ownedItemIdsFromInventoryEntries } from '../../domain/equipment/seedInventory'
import {
  addCatalogueInventoryItem,
  addCustomInventoryItem,
  adjustInventoryCurrency,
  adjustInventoryEntryQuantity,
  mergeInventoryStacks,
  moveInventoryEntry,
  removeInventoryEntry,
  setInventoryCurrency,
  setInventoryEntryQuantity,
  splitInventoryStack,
  type AddCatalogueInventoryItemInput,
  type AddCustomInventoryItemInput,
  type InventoryMutationResult,
} from '../../domain/equipment/inventoryMutations'
import { mergeCustomDefinitionsIntoCatalog } from '../../domain/equipment/customItems'
import { reconcileEquipmentLoadout } from '../../domain/equipment/equipmentLoadout'
import {
  formatGoldPieces,
  formatInventoryLine,
} from '../../features/equipment/formatEquipment'
import {
  isClassStartingEquipmentResolved,
  type ResolvedEquipment,
} from '../../rules/character/resolveCharacterEquipment'
import {
  buildPlayResolvedEquipmentView,
  trySeedInventoryFromResolvedEquipment,
} from '../../rules/equipment/seedCharacterInventory'
import { DEFAULT_WIZARD_UI_STATE } from '../wizard/steps'
import { getCharacterOpenDestination } from '../wizard/resolveCharacterStepLanding'
import { getAllStepStatuses, getCharacterDetailsStepStatus } from '../wizard/stepStatus'
import type { WizardStepId } from '../wizard/types'
import { useAbilityScoresEditor } from './useAbilityScoresEditor'
import { useBackgroundEditor } from './useBackgroundEditor'
import { useClassEditor } from './useClassEditor'
import { useEditionChange } from './useEditionChange'
import { useFeatEditor } from './useFeatEditor'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useSpeciesEditor } from './useSpeciesEditor'

const defaultClassCatalog = createBundledClassCatalog()
const defaultBackgroundCatalog = createBundledBackgroundCatalog()
const defaultFeatCatalog = createBundledFeatCatalog()
const defaultSpellCatalog = createBundledSpellCatalog()
const defaultEquipmentCatalog = createBundledEquipmentCatalog()

export type UseCharacterEditorOptions = {
  repository: CharacterRepository
  speciesCatalog: SpeciesCatalog
  classCatalog?: ClassCatalog
  backgroundCatalog?: BackgroundCatalog
  featCatalog?: FeatCatalog
  spellCatalog?: SpellCatalog
  equipmentCatalog?: EquipmentCatalog
  randomSource?: () => number
  restoreFromStorage?: boolean
}

export function useCharacterEditor({
  repository,
  speciesCatalog,
  classCatalog = defaultClassCatalog,
  backgroundCatalog = defaultBackgroundCatalog,
  featCatalog = defaultFeatCatalog,
  spellCatalog = defaultSpellCatalog,
  equipmentCatalog = defaultEquipmentCatalog,
  randomSource = Math.random,
  restoreFromStorage = true,
}: UseCharacterEditorOptions) {
  const [character, setCharacter] = useState<Character>(() =>
    createDefaultCharacter(),
  )
  const [isLoading, setIsLoading] = useState(restoreFromStorage)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [finishMessage, setFinishMessage] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<WizardStepId>(
    DEFAULT_WIZARD_UI_STATE.activeStepId,
  )
  const [basicsTouched, setBasicsTouched] = useState(false)
  const [detailsTouched, setDetailsTouched] = useState(false)
  const hasCompletedInitialLoadRef = useRef(false)

  const prefersReducedMotion = usePrefersReducedMotion()

  const clearSaveMessage = useCallback(() => {
    setSaveMessage(null)
  }, [])

  const abilityScores = useAbilityScoresEditor({
    character,
    setCharacter,
    onDraftChange: clearSaveMessage,
  })

  const species = useSpeciesEditor({
    character,
    setCharacter,
    speciesCatalog,
    featCatalog,
    backgroundCatalog,
    onDraftChange: clearSaveMessage,
  })

  const classEditor = useClassEditor({
    character,
    setCharacter,
    classCatalog,
    featCatalog,
    backgroundCatalog,
    onDraftChange: clearSaveMessage,
  })

  const background = useBackgroundEditor({
    character,
    setCharacter,
    backgroundCatalog,
    featCatalog,
    onDraftChange: clearSaveMessage,
  })

  const feat = useFeatEditor({
    character,
    setCharacter,
    featCatalog,
    onDraftChange: clearSaveMessage,
  })

  const editionChange = useEditionChange({
    character,
    setCharacter,
    speciesCatalog,
    classCatalog,
    backgroundCatalog,
    featCatalog,
    resetSpeciesDraft: species.resetSpeciesDraft,
    resetClassDraft: classEditor.resetClassDraft,
    resetBackgroundDraft: background.resetBackgroundDraft,
    resetFeatDraft: feat.resetFeatDraft,
    onDraftChange: clearSaveMessage,
  })

  const { hydrateFromCharacter } = abilityScores

  useEffect(() => {
    if (!restoreFromStorage) {
      setIsLoading(false)
      return
    }

    let isActive = true

    async function loadCharacter() {
      const stored = await repository.load(getActiveCharacterId())
      if (isActive && stored !== null) {
        const hydratedCharacter: Character = {
          ...createDefaultCharacter(),
          ...stored,
          details: migrateLegacyCharacterDetails(stored.details),
        }
        setCharacter(hydratedCharacter)
        species.resetSpeciesDraft()
        classEditor.hydrateForCharacter(hydratedCharacter)
        background.resetBackgroundDraft()
        feat.resetFeatDraft()
        hydrateFromCharacter(hydratedCharacter)
      }
      if (isActive) {
        setIsLoading(false)
      }
    }

    void loadCharacter()

    return () => {
      isActive = false
    }
  }, [
    classEditor.hydrateForCharacter,
    background.resetBackgroundDraft,
    feat.resetFeatDraft,
    hydrateFromCharacter,
    repository,
    restoreFromStorage,
    species.resetSpeciesDraft,
  ])

  const canSaveCharacterState = canSaveCharacter(character.creationMethod, {
    standardArrayValidation: abilityScores.standardArrayValidation,
    pointBuyValidation: abilityScores.pointBuyValidation,
    rolledValidation: abilityScores.rolledValidation,
    speciesDraftIncomplete: species.speciesDraftIncomplete,
    classDraftIncomplete: classEditor.classDraftIncomplete,
    backgroundDraftIncomplete: background.backgroundDraftIncomplete,
    featDraftIncomplete: feat.featDraftIncomplete,
  })

  const saveBlockedMessage = formatSaveBlockedMessage(
    character.creationMethod,
    species.speciesDraftIncomplete,
    classEditor.classDraftIncomplete,
    background.backgroundDraftIncomplete,
    feat.featDraftIncomplete,
  )

  const spellcastingReview = useReviewSpellcasting(classCatalog, character, {
    featCatalog,
    backgroundCatalog,
    spellCatalog,
    speciesCatalog,
  })

  const { spellValidation, committedSpellsValid } = useSpellsStepValidation(
    spellcastingReview,
    character,
    spellCatalog,
  )

  const {
    resolvedEquipment,
    equipmentValidation,
    committedEquipmentValid,
  } = useEquipmentResolution(
    classCatalog,
    backgroundCatalog,
    equipmentCatalog,
    character,
  )

  const [playResolvedEquipment, setPlayResolvedEquipment] =
    useState<ResolvedEquipment | null>(null)

  useEffect(() => {
    setCharacter((current) => {
      const seeded = trySeedInventoryFromResolvedEquipment(
        current.equipment.inventory,
        resolvedEquipment,
      )

      if (seeded === null) {
        return current
      }

      return {
        ...current,
        equipment: {
          ...current.equipment,
          inventory: seeded,
        },
      }
    })
  }, [resolvedEquipment])

  useEffect(() => {
    if (!character.equipment.inventory.seededFromStartingEquipment) {
      setPlayResolvedEquipment(null)
      return
    }

    let isActive = true

    void (async () => {
      const definitions = new Map<string, EquipmentItemDefinition>()
      await Promise.all(
        character.equipment.inventory.entries.map(async (entry) => {
          if (definitions.has(entry.itemId)) {
            return
          }
          const definition = await equipmentCatalog.getEquipment(entry.itemId)
          if (definition !== null) {
            definitions.set(entry.itemId, definition)
          }
        }),
      )

      if (!isActive) {
        return
      }

      setPlayResolvedEquipment(
        buildPlayResolvedEquipmentView(
          character.equipment.inventory,
          definitions,
          resolvedEquipment.sources,
        ),
      )
    })()

    return () => {
      isActive = false
    }
  }, [
    character.equipment.inventory,
    equipmentCatalog,
    resolvedEquipment.sources,
  ])

  const ownedEquipment = playResolvedEquipment ?? resolvedEquipment

  const setSpellSourceStates = useCallback(
    (nextStates: SpellSourceState[]) => {
      clearSaveMessage()
      setCharacter((current) => {
        const prunedInactive = pruneInactiveSpellSourceStates(
          { ...current, spellSourceStates: nextStates },
          spellcastingReview.activeSources,
        )
        const prunedSpellbook = prunePreparedSpellsNotInSpellbook(
          prunedInactive,
          spellcastingReview,
        )
        return {
          ...current,
          spellSourceStates: pruneSpellsNotOnEntitlementList(
            prunedSpellbook,
            spellcastingReview,
          ),
        }
      })
    },
    [clearSaveMessage, spellcastingReview],
  )

  const setEquipmentSelections = useCallback(
    (nextSelections: EquipmentSelection[]) => {
      clearSaveMessage()
      const activeKeys = resolvedEquipment.sources.flatMap((source) =>
        collectActiveEquipmentSelectionKeysForDefinition(
          source.definition,
          source.source,
          nextSelections,
        ),
      )

      setCharacter((current) => ({
        ...current,
        equipment: {
          ...current.equipment,
          selections: pruneInactiveEquipmentSelections(
            {
              ...current,
              equipment: {
                ...current.equipment,
                selections: nextSelections,
              },
            },
            activeKeys,
          ),
        },
      }))
    },
    [clearSaveMessage, resolvedEquipment.sources],
  )

  const setEquipmentLoadout = useCallback(
    (nextLoadout: EquipmentLoadout) => {
      clearSaveMessage()
      setCharacter((current) => ({
        ...current,
        equipment: {
          ...current.equipment,
          loadout: nextLoadout,
        },
      }))
    },
    [clearSaveMessage],
  )

  const loadInventoryMutationDefinitions = useCallback(async () => {
    const definitions = new Map<string, EquipmentItemDefinition>()
    const itemIds = new Set(
      character.equipment.inventory.entries.map((entry) => entry.itemId),
    )

    await Promise.all(
      [...itemIds].map(async (itemId) => {
        const definition = await equipmentCatalog.getEquipment(itemId)
        if (definition !== null) {
          definitions.set(itemId, definition)
        }
      }),
    )

    return mergeCustomDefinitionsIntoCatalog(
      definitions,
      character.equipment.inventory.customItems ?? {},
    )
  }, [
    character.equipment.inventory.customItems,
    character.equipment.inventory.entries,
    equipmentCatalog,
  ])

  const applyInventoryMutation = useCallback(
    async (
      mutate: (
        equipment: typeof character.equipment,
        definitions: ReadonlyMap<string, EquipmentItemDefinition>,
      ) => InventoryMutationResult,
    ): Promise<InventoryMutationResult> => {
      const definitions = await loadInventoryMutationDefinitions()
      clearSaveMessage()

      let result: InventoryMutationResult = {
        ok: false,
        reason: 'entry-not-found',
      }

      setCharacter((current) => {
        result = mutate(current.equipment, definitions)
        if (!result.ok) {
          return current
        }

        return {
          ...current,
          equipment: result.equipment,
        }
      })

      return result
    },
    [clearSaveMessage, loadInventoryMutationDefinitions],
  )

  const setInventoryQuantity = useCallback(
    (instanceId: string, quantity: number) =>
      applyInventoryMutation((equipment, definitions) =>
        setInventoryEntryQuantity(equipment, instanceId, quantity, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const adjustInventoryQuantity = useCallback(
    (instanceId: string, delta: number) =>
      applyInventoryMutation((equipment, definitions) =>
        adjustInventoryEntryQuantity(equipment, instanceId, delta, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const removeInventoryItem = useCallback(
    (instanceId: string) =>
      applyInventoryMutation((equipment, definitions) =>
        removeInventoryEntry(equipment, instanceId, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const moveInventoryItem = useCallback(
    (instanceId: string, location: InventoryLocation) =>
      applyInventoryMutation((equipment, definitions) =>
        moveInventoryEntry(equipment, instanceId, location, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const splitInventoryItem = useCallback(
    (instanceId: string, quantity: number) =>
      applyInventoryMutation((equipment, definitions) =>
        splitInventoryStack(equipment, instanceId, quantity, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const mergeInventoryItems = useCallback(
    (targetInstanceId: string, sourceInstanceId: string) =>
      applyInventoryMutation((equipment, definitions) =>
        mergeInventoryStacks(
          equipment,
          targetInstanceId,
          sourceInstanceId,
          { definitionsById: definitions },
        ),
      ),
    [applyInventoryMutation],
  )

  const setCurrencyGoldPieces = useCallback(
    (goldPieces: number) =>
      applyInventoryMutation((equipment, definitions) =>
        setInventoryCurrency(equipment, goldPieces, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const adjustCurrencyGoldPieces = useCallback(
    (delta: number) =>
      applyInventoryMutation((equipment, definitions) =>
        adjustInventoryCurrency(equipment, delta, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const addCatalogueInventoryItemToCharacter = useCallback(
    async (input: AddCatalogueInventoryItemInput) => {
      const definition = await equipmentCatalog.getEquipment(input.itemId)
      return applyInventoryMutation((equipment, definitions) => {
        const nextDefinitions = new Map(definitions)
        if (definition !== null) {
          nextDefinitions.set(input.itemId, definition)
        }
        return addCatalogueInventoryItem(equipment, input, {
          definitionsById: nextDefinitions,
        })
      })
    },
    [applyInventoryMutation, equipmentCatalog],
  )

  const addCustomInventoryItemToCharacter = useCallback(
    (input: AddCustomInventoryItemInput) =>
      applyInventoryMutation((equipment, definitions) =>
        addCustomInventoryItem(equipment, input, {
          definitionsById: definitions,
        }),
      ),
    [applyInventoryMutation],
  )

  const inventoryOwnershipKey = character.equipment.inventory
    .seededFromStartingEquipment
    ? character.equipment.inventory.entries
        .map((entry) => entry.itemId)
        .sort()
        .join('|')
    : resolvedEquipment.inventory
        .map((item) => item.itemId)
        .sort()
        .join('|')

  useEffect(() => {
    let isActive = true

    void (async () => {
      const ownedItemIds = character.equipment.inventory
        .seededFromStartingEquipment
        ? ownedItemIdsFromInventoryEntries(
            character.equipment.inventory.entries,
          )
        : new Set(resolvedEquipment.inventory.map((entry) => entry.itemId))

      const definitions = new Map<string, EquipmentItemDefinition>()

      await Promise.all(
        [...ownedItemIds].map(async (itemId) => {
          const definition = await equipmentCatalog.getEquipment(itemId)
          if (definition !== null) {
            definitions.set(itemId, definition)
          }
        }),
      )

      if (!isActive) {
        return
      }

      setCharacter((current) => {
        const currentLoadout =
          current.equipment.loadout ?? EMPTY_EQUIPMENT_LOADOUT
        const nextLoadout = reconcileEquipmentLoadout(
          currentLoadout,
          ownedItemIds,
          definitions,
          { inferEmptySlots: true },
        )

        if (
          nextLoadout.armorItemId === currentLoadout.armorItemId &&
          nextLoadout.mainHandItemId === currentLoadout.mainHandItemId &&
          nextLoadout.offHandItemId === currentLoadout.offHandItemId &&
          nextLoadout.mainHandGrip === currentLoadout.mainHandGrip
        ) {
          return current
        }

        return {
          ...current,
          equipment: {
            ...current.equipment,
            loadout: nextLoadout,
          },
        }
      })
    })()

    return () => {
      isActive = false
    }
  }, [
    character.equipment.inventory,
    equipmentCatalog,
    inventoryOwnershipKey,
    resolvedEquipment.inventory,
  ])

  // Prune source states when class / feat / background / species identity change.
  const ownershipKey = [
    character.classes
      .map((entry) => `${entry.instanceId}:${entry.level}`)
      .join(','),
    character.feat?.featId ?? '',
    character.background?.backgroundId ?? '',
    character.species?.speciesId ?? '',
    character.species !== null
      ? JSON.stringify(character.species.choices)
      : '',
    String(character.targetLevel),
  ].join('|')

  useEffect(() => {
    setCharacter((current) => {
      const prunedInactive = pruneInactiveSpellSourceStates(
        current,
        spellcastingReview.activeSources,
      )
      const prunedSpellbook = prunePreparedSpellsNotInSpellbook(
        prunedInactive,
        spellcastingReview,
      )
      const prunedSpells = pruneSpellsNotOnEntitlementList(
        prunedSpellbook,
        spellcastingReview,
      )
      const activeEquipmentKeys = resolvedEquipment.sources.flatMap((source) =>
        collectActiveEquipmentSelectionKeysForDefinition(
          source.definition,
          source.source,
          current.equipment.selections,
        ),
      )
      const prunedEquipment = pruneInactiveEquipmentSelections(
        current,
        activeEquipmentKeys,
      )

      const spellsChanged =
        prunedSpells.length !== current.spellSourceStates.length ||
        prunedSpells.some((state, index) => {
          const previous = current.spellSourceStates[index]
          if (previous === undefined) {
            return true
          }
          if (state.selections.length !== previous.selections.length) {
            return true
          }
          return state.selections.some(
            (selection, selectionIndex) =>
              selection.spellId !==
              previous.selections[selectionIndex]?.spellId,
          )
        })
      const equipmentChanged =
        prunedEquipment.length !== current.equipment.selections.length

      if (!spellsChanged && !equipmentChanged) {
        return current
      }

      return {
        ...current,
        spellSourceStates: prunedSpells,
        equipment: {
          ...current.equipment,
          selections: prunedEquipment,
        },
      }
    })
    // ownershipKey tracks removed class/feat/background; activeSources read from latest summary.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [ownershipKey])

  const stepStatuses = getAllStepStatuses({
    character,
    basicsTouched,
    detailsTouched,
    abilityScoresTouched: abilityScores.abilityScoresTouched,
    speciesDraft: species.speciesDraft,
    speciesDraftValidation: species.speciesDraftValidation,
    committedSpeciesValid: species.committedSpeciesValid,
    classDraft: classEditor.classDraft,
    classDraftValidation: classEditor.classDraftValidation,
    committedClassValid: classEditor.committedClassValid,
    backgroundDraft: background.backgroundDraft,
    backgroundDraftValidation: background.backgroundDraftValidation,
    committedBackgroundValid: background.committedBackgroundValid,
    featDraft: feat.featDraft,
    featDraftValidation: feat.featDraftValidation,
    committedFeatValid: feat.committedFeatValid,
    spellValidation,
    committedSpellsValid,
    equipmentValidation,
    committedEquipmentValid,
    standardArrayValidation: abilityScores.standardArrayValidation,
    pointBuyValidation: abilityScores.pointBuyValidation,
    rolledValidation: abilityScores.rolledValidation,
  })

  const speciesReviewDisplay = useReviewSpeciesDisplay(
    speciesCatalog,
    character.editionId,
    character.species,
    species.speciesDraft,
  )

  const classReviewDisplay = useReviewClassDisplay(
    classCatalog,
    character.editionId,
    character.classes,
    classEditor.classDrafts,
    character.targetLevel,
  )

  const backgroundReviewDisplay = useReviewBackgroundDisplay(
    backgroundCatalog,
    character.editionId,
    character.background,
    background.backgroundDraft,
  )

  const featReviewDisplay = useReviewFeatDisplay(
    featCatalog,
    character.editionId,
    character.feat,
    feat.featDraft,
  )

  const wizardStepContext = createWizardStepContext(character, {
    hasSpellContent: spellcastingReview.hasSpellContent,
  })
  const reviewableStepIds = getReviewableStepIds(wizardStepContext)

  const reviewSheetModels = useReviewSheetModels(
    character,
    speciesCatalog,
    classCatalog,
    backgroundCatalog,
    featCatalog,
    {
      classDrafts: classEditor.classDrafts,
      resolvedEquipment: ownedEquipment,
      equipmentCatalog,
    },
  )

  const unresolvedDeferredRequirements = useDeferredCharacterRequirements(
    classCatalog,
    character,
    classEditor.classDraft,
    classEditor.activeInstanceId,
  ).filter((requirement) => {
    if (requirement.requirementId !== 'starting-equipment') {
      return true
    }

    return !isClassStartingEquipmentResolved(
      resolvedEquipment,
      requirement.sourceInstanceId,
    )
  })

  const finishPolicy = getFinishPolicyResult(
    stepStatuses,
    unresolvedDeferredRequirements,
    {
      requireCompleteSpells: spellcastingReview.hasSpellContent,
    },
  )

  const equipmentLines = [
    ...ownedEquipment.inventory.map((item) => formatInventoryLine(item)),
    ...(ownedEquipment.currency.goldPieces > 0
      ? [formatGoldPieces(ownedEquipment.currency.goldPieces)]
      : []),
  ]

  const reviewSummaries = buildReviewSummaries(
    {
      character,
      speciesDraft: species.speciesDraft,
      speciesDisplay: speciesReviewDisplay,
      classDraft: classEditor.classDraft,
      classDisplay: classReviewDisplay,
      backgroundDraft: background.backgroundDraft,
      backgroundDisplay: backgroundReviewDisplay,
      featDraft: feat.featDraft,
      featDisplay: featReviewDisplay,
      unresolvedDeferredRequirements,
      standardArrayValidation: abilityScores.standardArrayValidation,
      pointBuyValidation: abilityScores.pointBuyValidation,
      rolledValidation: abilityScores.rolledValidation,
      equipmentLines,
    },
    {
      basics: stepStatuses.basics,
      species: stepStatuses.species,
      'ability-scores': stepStatuses['ability-scores'],
      class: stepStatuses.class,
      background: stepStatuses.background,
      equipment: stepStatuses.equipment,
      feats: stepStatuses.feats,
      spells: stepStatuses.spells,
      inventory: stepStatuses.inventory,
    },
  )
  const characterDetailsReviewSections = buildCharacterDetailsReviewSections({
    character,
    speciesDraft: species.speciesDraft,
    speciesDisplay: speciesReviewDisplay,
    classDraft: classEditor.classDraft,
    classDisplay: classReviewDisplay,
    backgroundDraft: background.backgroundDraft,
    backgroundDisplay: backgroundReviewDisplay,
    featDraft: feat.featDraft,
    featDisplay: featReviewDisplay,
    unresolvedDeferredRequirements,
    standardArrayValidation: abilityScores.standardArrayValidation,
    pointBuyValidation: abilityScores.pointBuyValidation,
    rolledValidation: abilityScores.rolledValidation,
  })
  const characterDetailsStatus = getCharacterDetailsStepStatus({
    character,
    detailsTouched,
  })
  const finishBlockedMessage = formatFinishBlockedMessage(finishPolicy)

  const handleFinish = useCallback(async () => {
    if (!finishPolicy.canFinish) {
      setFinishMessage(finishBlockedMessage)
      return
    }

    if (!canSaveCharacterState) {
      setFinishMessage(
        'Fix the remaining validation issues before finishing your character.',
      )
      return
    }

    const characterToSave = buildCharacterForSave({
      character,
      standardArrayDraft: abilityScores.standardArrayDraft,
      pointBuyDraft: abilityScores.pointBuyDraft,
      rolledDraft: abilityScores.rolledDraft,
    })

    await repository.save(characterToSave)
    setCharacter(characterToSave)
    setFinishMessage('Character complete.')
    setSaveMessage(null)
  }, [
    abilityScores.pointBuyDraft,
    abilityScores.rolledDraft,
    abilityScores.standardArrayDraft,
    canSaveCharacterState,
    character,
    finishBlockedMessage,
    finishPolicy.canFinish,
    repository,
  ])

  useEffect(() => {
    if (isLoading) {
      hasCompletedInitialLoadRef.current = false
      return
    }

    if (!hasCompletedInitialLoadRef.current) {
      hasCompletedInitialLoadRef.current = true
      return
    }

    if (!canSaveCharacterState) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const characterToSave = buildCharacterForSave({
        character,
        standardArrayDraft: abilityScores.standardArrayDraft,
        pointBuyDraft: abilityScores.pointBuyDraft,
        rolledDraft: abilityScores.rolledDraft,
      })

      void Promise.resolve(repository.save(characterToSave)).then(() => {
        setCharacter((current) => {
          if (
            current.abilityScores.strength ===
              characterToSave.abilityScores.strength &&
            current.abilityScores.dexterity ===
              characterToSave.abilityScores.dexterity &&
            current.abilityScores.constitution ===
              characterToSave.abilityScores.constitution &&
            current.abilityScores.intelligence ===
              characterToSave.abilityScores.intelligence &&
            current.abilityScores.wisdom ===
              characterToSave.abilityScores.wisdom &&
            current.abilityScores.charisma ===
              characterToSave.abilityScores.charisma
          ) {
            return current
          }

          return characterToSave
        })
        setSaveMessage(null)
      })
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    abilityScores.pointBuyDraft,
    abilityScores.rolledDraft,
    abilityScores.standardArrayDraft,
    canSaveCharacterState,
    character,
    isLoading,
    repository,
  ])

  const updateName = useCallback(
    (name: string) => {
      setCharacter((current) => ({ ...current, name }))
      clearSaveMessage()
    },
    [clearSaveMessage],
  )

  const updateDetails = useCallback(
    (updates: Partial<CharacterDetails>) => {
      setCharacter((current) => ({
        ...current,
        details: {
          ...current.details,
          ...updates,
        },
      }))
      clearSaveMessage()
    },
    [clearSaveMessage],
  )

  const applyCharacterState = useCallback(
    (
      nextCharacter: Character,
      options?: {
        activeStepId?: WizardStepId
        markAbilityScoresTouched?: boolean
      },
    ) => {
      setCharacter(nextCharacter)
      setActiveStepId(
        options?.activeStepId ?? DEFAULT_WIZARD_UI_STATE.activeStepId,
      )
      setBasicsTouched(false)
      setDetailsTouched(false)
      setSaveMessage(null)
      setFinishMessage(null)
      species.resetSpeciesDraft()
      classEditor.resetClassDraft()
      background.resetBackgroundDraft()
      feat.resetFeatDraft()
      hydrateFromCharacter(nextCharacter, {
        markTouched: options?.markAbilityScoresTouched === true,
      })
      setActiveCharacterId(nextCharacter.id)
    },
    [
      background.resetBackgroundDraft,
      classEditor.resetClassDraft,
      feat.resetFeatDraft,
      hydrateFromCharacter,
      species.resetSpeciesDraft,
    ],
  )

  const startNewCharacter = useCallback(async () => {
    const freshCharacter = createDefaultCharacter({
      id: createCharacterId(),
    })
    applyCharacterState(freshCharacter)
    await repository.save(freshCharacter)
  }, [applyCharacterState, repository])

  const importCharacter = useCallback(
    async (importedCharacter: Character) => {
      const landingStep = await getCharacterOpenDestination(importedCharacter, {
        speciesCatalog,
        classCatalog,
        backgroundCatalog,
        featCatalog,
        spellCatalog,
        equipmentCatalog,
      })

      applyCharacterState(importedCharacter, {
        activeStepId: landingStep,
        markAbilityScoresTouched: true,
      })
      await repository.save(importedCharacter)
    },
    [
      applyCharacterState,
      backgroundCatalog,
      classCatalog,
      equipmentCatalog,
      featCatalog,
      repository,
      speciesCatalog,
      spellCatalog,
    ],
  )

  const openCharacter = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true)

      try {
        const stored = await repository.load(id)
        if (stored === null) {
          return false
        }

        const hydratedCharacter: Character = {
          ...createDefaultCharacter(),
          ...stored,
          details: migrateLegacyCharacterDetails(stored.details),
        }

        const landingStep = await getCharacterOpenDestination(
          hydratedCharacter,
          {
            speciesCatalog,
            classCatalog,
            backgroundCatalog,
            featCatalog,
            spellCatalog,
            equipmentCatalog,
          },
        )

        setCharacter(hydratedCharacter)
        setActiveStepId(landingStep)
        setBasicsTouched(false)
        setDetailsTouched(false)
        setSaveMessage(null)
        setFinishMessage(null)
        species.resetSpeciesDraft()
        classEditor.hydrateForCharacter(hydratedCharacter)
        background.resetBackgroundDraft()
        feat.resetFeatDraft()
        hydrateFromCharacter(hydratedCharacter, { markTouched: true })
        setActiveCharacterId(hydratedCharacter.id)
        return true
      } finally {
        setIsLoading(false)
      }
    },
    [
      background.resetBackgroundDraft,
      backgroundCatalog,
      classCatalog,
      classEditor.hydrateForCharacter,
      equipmentCatalog,
      feat.resetFeatDraft,
      featCatalog,
      hydrateFromCharacter,
      repository,
      species.resetSpeciesDraft,
      speciesCatalog,
      spellCatalog,
    ],
  )

  const handleExportCharacter = useCallback(() => {
    const characterToExport = buildCharacterForSave({
      character,
      standardArrayDraft: abilityScores.standardArrayDraft,
      pointBuyDraft: abilityScores.pointBuyDraft,
      rolledDraft: abilityScores.rolledDraft,
    })

    downloadCharacterFile(characterToExport)
  }, [
    abilityScores.pointBuyDraft,
    abilityScores.rolledDraft,
    abilityScores.standardArrayDraft,
    character,
  ])

  return {
    isLoading,
    prefersReducedMotion,
    randomSource,
    character,
    activeStepId,
    setActiveStepId,
    wizardStepContext,
    reviewableStepIds,
    stepStatuses,
    reviewSummaries,
    characterDetailsReviewSections,
    characterDetailsStatus,
    speciesReviewDisplay,
    classReviewDisplay,
    reviewSheetModels,
    spellcastingReview,
    spellCatalog,
    spellValidation,
    setSpellSourceStates,
    resolvedEquipment,
    ownedEquipment,
    equipmentValidation,
    setEquipmentSelections,
    setEquipmentLoadout,
    setInventoryQuantity,
    adjustInventoryQuantity,
    removeInventoryItem,
    moveInventoryItem,
    splitInventoryItem,
    mergeInventoryItems,
    setCurrencyGoldPieces,
    adjustCurrencyGoldPieces,
    addCatalogueInventoryItem: addCatalogueInventoryItemToCharacter,
    addCustomInventoryItem: addCustomInventoryItemToCharacter,
    unresolvedDeferredRequirements,
    finishPolicy,
    finishBlockedMessage,
    finishMessage,
    canSaveCharacterState,
    saveMessage,
    saveBlockedMessage,
    setBasicsTouched,
    setDetailsTouched,
    updateDetails,
    abilityScores,
    species,
    classEditor,
    background,
    feat,
    classCatalog,
    backgroundCatalog,
    featCatalog,
    equipmentCatalog,
    editionChange,
    speciesCatalog,
    handleFinish,
    handleExportCharacter,
    startNewCharacter,
    importCharacter,
    openCharacter,
    updateName,
  }
}
