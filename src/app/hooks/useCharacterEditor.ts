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
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
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
import { useReviewSheetModels } from '../useReviewSheetModels'
import { DEFAULT_WIZARD_UI_STATE } from '../wizard/steps'
import { getAllStepStatuses } from '../wizard/stepStatus'
import type { WizardStepId } from '../wizard/types'
import { useAbilityScoresEditor } from './useAbilityScoresEditor'
import { useBackgroundEditor } from './useBackgroundEditor'
import { useClassEditor } from './useClassEditor'
import { useEditionChange } from './useEditionChange'
import { useFeatEditor } from './useFeatEditor'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useSpeciesEditor } from './useSpeciesEditor'

export type UseCharacterEditorOptions = {
  repository: CharacterRepository
  speciesCatalog: SpeciesCatalog
  classCatalog?: ClassCatalog
  backgroundCatalog?: BackgroundCatalog
  featCatalog?: FeatCatalog
  randomSource?: () => number
  restoreFromStorage?: boolean
}

export function useCharacterEditor({
  repository,
  speciesCatalog,
  classCatalog = createBundledClassCatalog(),
  backgroundCatalog = createBundledBackgroundCatalog(),
  featCatalog = createBundledFeatCatalog(),
  randomSource = Math.random,
  restoreFromStorage = true,
}: UseCharacterEditorOptions) {
  const [character, setCharacter] = useState<Character>(() =>
    createDefaultCharacter(),
  )
  const [isLoading, setIsLoading] = useState(true)
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
    onDraftChange: clearSaveMessage,
  })

  const classEditor = useClassEditor({
    character,
    setCharacter,
    classCatalog,
    featCatalog,
    onDraftChange: clearSaveMessage,
  })

  const background = useBackgroundEditor({
    character,
    setCharacter,
    backgroundCatalog,
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

  const wizardStepContext = createWizardStepContext(character)
  const reviewableStepIds = getReviewableStepIds(wizardStepContext)

  const spellcastingReview = useReviewSpellcasting(classCatalog, character)

  const reviewSheetModels = useReviewSheetModels(
    character,
    speciesCatalog,
    classCatalog,
    backgroundCatalog,
    featCatalog,
  )

  const unresolvedDeferredRequirements = useDeferredCharacterRequirements(
    classCatalog,
    character,
    classEditor.classDraft,
    classEditor.activeInstanceId,
  )

  const finishPolicy = getFinishPolicyResult(
    stepStatuses,
    unresolvedDeferredRequirements,
  )
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
    },
    {
      basics: stepStatuses.basics,
      species: stepStatuses.species,
      'character-details': stepStatuses['character-details'],
      'ability-scores': stepStatuses['ability-scores'],
      class: stepStatuses.class,
      background: stepStatuses.background,
      equipment: stepStatuses.equipment,
      feats: stepStatuses.feats,
      spells: stepStatuses.spells,
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
    (nextCharacter: Character) => {
      setCharacter(nextCharacter)
      setActiveStepId(DEFAULT_WIZARD_UI_STATE.activeStepId)
      setBasicsTouched(false)
      setDetailsTouched(false)
      setSaveMessage(null)
      setFinishMessage(null)
      species.resetSpeciesDraft()
      classEditor.resetClassDraft()
      background.resetBackgroundDraft()
      feat.resetFeatDraft()
      hydrateFromCharacter(nextCharacter)
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
      applyCharacterState(importedCharacter)
      await repository.save(importedCharacter)
    },
    [applyCharacterState, repository],
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
    speciesReviewDisplay,
    classReviewDisplay,
    reviewSheetModels,
    spellcastingReview,
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
    editionChange,
    speciesCatalog,
    handleFinish,
    handleExportCharacter,
    startNewCharacter,
    importCharacter,
    updateName,
  }
}
