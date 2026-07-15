import { useCallback, useEffect, useState } from 'react'
import { createDefaultCharacter, DEFAULT_CHARACTER_ID } from '../../domain/character/defaults'
import { migrateLegacyCharacterDetails } from '../../domain/character/migrateCharacterDetails'
import type { CharacterRepository } from '../../domain/ports/characterRepository'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { buildCharacterForSave } from '../buildCharacterForSave'
import {
  canSaveCharacter,
  formatSaveBlockedMessage,
} from '../characterSavePolicy'
import {
  formatIncompleteRequiredStepsMessage,
  getFinishPolicyResult,
} from '../characterFinishPolicy'
import type { CharacterDetails } from '../../domain/types'
import { buildReviewSummaries, buildCharacterDetailsReviewSections, getReviewableStepIds } from '../reviewSummary'
import { createWizardStepContext } from '../wizard/stepVisibility'
import { useReviewClassDisplay } from '../useReviewClassDisplay'
import { useReviewBackgroundDisplay } from '../useReviewBackgroundDisplay'
import { useReviewSpeciesDisplay } from '../useReviewSpeciesDisplay'
import { DEFAULT_WIZARD_UI_STATE } from '../wizard/steps'
import { getAllStepStatuses } from '../wizard/stepStatus'
import type { WizardStepId } from '../wizard/types'
import { useAbilityScoresEditor } from './useAbilityScoresEditor'
import { useBackgroundEditor } from './useBackgroundEditor'
import { useClassEditor } from './useClassEditor'
import { useEditionChange } from './useEditionChange'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useSpeciesEditor } from './useSpeciesEditor'

export type UseCharacterEditorOptions = {
  repository: CharacterRepository
  speciesCatalog: SpeciesCatalog
  classCatalog?: ClassCatalog
  backgroundCatalog?: BackgroundCatalog
  randomSource?: () => number
}

export function useCharacterEditor({
  repository,
  speciesCatalog,
  classCatalog = createBundledClassCatalog(),
  backgroundCatalog = createBundledBackgroundCatalog(),
  randomSource = Math.random,
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
    onDraftChange: clearSaveMessage,
  })

  const background = useBackgroundEditor({
    character,
    setCharacter,
    backgroundCatalog,
    onDraftChange: clearSaveMessage,
  })

  const editionChange = useEditionChange({
    character,
    setCharacter,
    speciesCatalog,
    classCatalog,
    backgroundCatalog,
    resetSpeciesDraft: species.resetSpeciesDraft,
    resetClassDraft: classEditor.resetClassDraft,
    resetBackgroundDraft: background.resetBackgroundDraft,
    onDraftChange: clearSaveMessage,
  })

  const { hydrateFromCharacter } = abilityScores

  useEffect(() => {
    let isActive = true

    async function loadCharacter() {
      const stored = await repository.load(DEFAULT_CHARACTER_ID)
      if (isActive && stored !== null) {
        const hydratedCharacter: Character = {
          ...createDefaultCharacter(),
          ...stored,
          details: migrateLegacyCharacterDetails(stored.details),
        }
        setCharacter(hydratedCharacter)
        species.resetSpeciesDraft()
        classEditor.resetClassDraft()
        background.resetBackgroundDraft()
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
    classEditor.resetClassDraft,
    background.resetBackgroundDraft,
    hydrateFromCharacter,
    repository,
    species.resetSpeciesDraft,
  ])

  const canSaveCharacterState = canSaveCharacter(character.creationMethod, {
    standardArrayValidation: abilityScores.standardArrayValidation,
    pointBuyValidation: abilityScores.pointBuyValidation,
    rolledValidation: abilityScores.rolledValidation,
    speciesDraftIncomplete: species.speciesDraftIncomplete,
    classDraftIncomplete: classEditor.classDraftIncomplete,
    backgroundDraftIncomplete: background.backgroundDraftIncomplete,
  })

  const saveBlockedMessage = formatSaveBlockedMessage(
    character.creationMethod,
    species.speciesDraftIncomplete,
    classEditor.classDraftIncomplete,
    background.backgroundDraftIncomplete,
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
    character.class,
    classEditor.classDraft,
  )

  const backgroundReviewDisplay = useReviewBackgroundDisplay(
    backgroundCatalog,
    character.editionId,
    character.background,
    background.backgroundDraft,
  )

  const wizardStepContext = createWizardStepContext(character)
  const reviewableStepIds = getReviewableStepIds(wizardStepContext)

  const finishPolicy = getFinishPolicyResult(stepStatuses)
  const reviewSummaries = buildReviewSummaries(
    {
      character,
      speciesDraft: species.speciesDraft,
      speciesDisplay: speciesReviewDisplay,
      classDraft: classEditor.classDraft,
      classDisplay: classReviewDisplay,
      backgroundDraft: background.backgroundDraft,
      backgroundDisplay: backgroundReviewDisplay,
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
    standardArrayValidation: abilityScores.standardArrayValidation,
    pointBuyValidation: abilityScores.pointBuyValidation,
    rolledValidation: abilityScores.rolledValidation,
  })
  const finishBlockedMessage = formatIncompleteRequiredStepsMessage(
    finishPolicy.canFinish ? [] : finishPolicy.incompleteRequiredSteps,
  )

  const handleSaveDraft = useCallback(async () => {
    if (!canSaveCharacterState) {
      setSaveMessage(saveBlockedMessage)
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
    setSaveMessage('Character saved.')
    setFinishMessage(null)
  }, [
    abilityScores.pointBuyDraft,
    abilityScores.rolledDraft,
    abilityScores.standardArrayDraft,
    canSaveCharacterState,
    character,
    repository,
    saveBlockedMessage,
  ])

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
    classCatalog,
    backgroundCatalog,
    editionChange,
    speciesCatalog,
    handleSaveDraft,
    handleFinish,
    updateName,
  }
}
