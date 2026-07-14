import { useEffect, useState } from 'react'
import { createLocalStorageCharacterRepository } from '../adapters/localStorageCharacterRepository'
import { createBundledSpeciesCatalog } from '../adapters/bundledSpeciesCatalog'
import {
  createDefaultCharacter,
  DEFAULT_CHARACTER_ID,
} from '../domain/character/defaults'
import type { AbilityScores, Character, EditionId } from '../domain/types'
import { AbilityScoresForm } from '../features/ability-scores/AbilityScoresForm'
import { EditionChangeDialog } from '../features/species/EditionChangeDialog'
import { SpeciesPicker } from '../features/species/SpeciesPicker'
import {
  isSpeciesDraftIncomplete,
  type SpeciesSelectionDraft,
} from '../features/species/speciesSelectionDraft'
import {
  adjustPointBuyDraftScore,
  createMinimumPointBuyDraft,
  initializePointBuyDraftFromAbilityScores,
  resetPointBuyDraft,
  type PointBuyDraftScores,
} from '../features/ability-scores/pointBuyDraft'
import {
  assignRolledResult,
  initializeRolledDraftFromAbilityScores,
  rolledDraftToAbilityScores,
  type RolledDraft,
  validateRolledDraft,
} from '../features/ability-scores/rolledDraft'
import {
  abilityScoresToStandardArrayDraft,
  createEmptyStandardArrayDraft,
  defaultStandardArrayDraft,
  standardArrayDraftToAbilityScores,
  type StandardArrayDraftScores,
  validateStandardArrayDraft,
} from '../features/ability-scores/standardArrayDraft'
import { validatePointBuyAssignment } from '../rules/point-buy'
import { needsEditionChangeSpeciesConfirmation } from '../rules/species/speciesRules'
import { canSaveCharacter } from './characterSavePolicy'
import { CharacterWizard } from './wizard/CharacterWizard'
import { DEFAULT_WIZARD_UI_STATE } from './wizard/steps'
import { BasicsStep } from './wizard/steps/BasicsStep'
import { getAllStepStatuses } from './wizard/stepStatus'
import type { WizardStepId } from './wizard/types'
import './app.css'

const repository = createLocalStorageCharacterRepository()
const speciesCatalog = createBundledSpeciesCatalog()

type AppProps = {
  randomSource?: () => number
}

export default function App({ randomSource = Math.random }: AppProps) {
  const [character, setCharacter] = useState<Character>(() =>
    createDefaultCharacter(),
  )
  const [standardArrayDraft, setStandardArrayDraft] =
    useState<StandardArrayDraftScores | null>(null)
  const [pointBuyDraft, setPointBuyDraft] = useState<PointBuyDraftScores | null>(
    null,
  )
  const [rolledDraft, setRolledDraft] = useState<RolledDraft | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [pendingEditionId, setPendingEditionId] = useState<EditionId | null>(
    null,
  )
  const [speciesDraft, setSpeciesDraft] = useState<SpeciesSelectionDraft | null>(
    null,
  )
  const [activeStepId, setActiveStepId] = useState<WizardStepId>(
    DEFAULT_WIZARD_UI_STATE.activeStepId,
  )
  const [basicsTouched, setBasicsTouched] = useState(false)
  const [abilityScoresTouched, setAbilityScoresTouched] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => {
      mediaQuery.removeEventListener('change', updatePreference)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadCharacter() {
      const stored = await repository.load(DEFAULT_CHARACTER_ID)
      if (isActive && stored !== null) {
        setCharacter(stored)
        setSpeciesDraft(null)
        if (stored.creationMethod === 'standard-array') {
          setStandardArrayDraft(
            abilityScoresToStandardArrayDraft(stored.abilityScores),
          )
        }
        if (stored.creationMethod === 'point-buy') {
          setPointBuyDraft(
            initializePointBuyDraftFromAbilityScores(stored.abilityScores),
          )
        }
        if (stored.creationMethod === 'rolled') {
          setRolledDraft(
            initializeRolledDraftFromAbilityScores(stored.abilityScores),
          )
        }
      }
      if (isActive) {
        setIsLoading(false)
      }
    }

    void loadCharacter()

    return () => {
      isActive = false
    }
  }, [])

  const standardArrayValidation =
    character.creationMethod === 'standard-array' && standardArrayDraft !== null
      ? validateStandardArrayDraft(standardArrayDraft)
      : null
  const pointBuyValidation =
    character.creationMethod === 'point-buy' && pointBuyDraft !== null
      ? validatePointBuyAssignment(pointBuyDraft)
      : null
  const rolledValidation =
    character.creationMethod === 'rolled' && rolledDraft !== null
      ? validateRolledDraft(rolledDraft)
      : null
  const speciesDraftIncomplete = isSpeciesDraftIncomplete(
    speciesDraft,
    character.species,
  )
  const canSaveCharacterState = canSaveCharacter(character.creationMethod, {
    standardArrayValidation,
    pointBuyValidation,
    rolledValidation,
    speciesDraftIncomplete,
  })
  const stepStatuses = getAllStepStatuses({
    character,
    basicsTouched,
    abilityScoresTouched,
    speciesDraft,
    speciesDraftValidation: null,
    committedSpeciesValid: character.species !== null,
    standardArrayValidation,
    pointBuyValidation,
    rolledValidation,
  })

  function updateAbilityScore(ability: keyof AbilityScores, value: number) {
    setCharacter((current) => ({
      ...current,
      abilityScores: {
        ...current.abilityScores,
        [ability]: value,
      },
    }))
    setSaveMessage(null)
  }

  function replaceStandardArrayDraft(nextDraft: StandardArrayDraftScores) {
    setStandardArrayDraft(nextDraft)

    if (validateStandardArrayDraft(nextDraft).valid) {
      setCharacter((currentCharacter) => ({
        ...currentCharacter,
        abilityScores: standardArrayDraftToAbilityScores(nextDraft),
      }))
    }

    setSaveMessage(null)
  }

  function replacePointBuyDraft(nextDraft: PointBuyDraftScores) {
    setPointBuyDraft(nextDraft)

    if (validatePointBuyAssignment(nextDraft).valid) {
      setCharacter((currentCharacter) => ({
        ...currentCharacter,
        abilityScores: { ...nextDraft },
      }))
    }

    setSaveMessage(null)
  }

  function updateStandardArrayDraft(
    ability: keyof StandardArrayDraftScores,
    value: number | null,
  ) {
    setStandardArrayDraft((current) => {
      if (current === null) {
        return current
      }

      const nextDraft = {
        ...current,
        [ability]: value,
      }
      const validation = validateStandardArrayDraft(nextDraft)

      if (validation.valid) {
        setCharacter((currentCharacter) => ({
          ...currentCharacter,
          abilityScores: standardArrayDraftToAbilityScores(nextDraft),
        }))
      }

      return nextDraft
    })
    setSaveMessage(null)
  }

  function updatePointBuyDraft(
    ability: keyof PointBuyDraftScores,
    delta: -1 | 1,
  ) {
    setPointBuyDraft((current) => {
      if (current === null) {
        return current
      }

      const nextDraft = adjustPointBuyDraftScore(current, ability, delta)

      if (validatePointBuyAssignment(nextDraft).valid) {
        setCharacter((currentCharacter) => ({
          ...currentCharacter,
          abilityScores: { ...nextDraft },
        }))
      }

      return nextDraft
    })
    setSaveMessage(null)
  }

  function replaceRolledDraft(nextDraft: RolledDraft) {
    setRolledDraft(nextDraft)

    if (validateRolledDraft(nextDraft).valid) {
      setCharacter((currentCharacter) => ({
        ...currentCharacter,
        abilityScores: rolledDraftToAbilityScores(nextDraft),
      }))
    }

    setSaveMessage(null)
  }

  function updateRolledAssignment(
    ability: keyof RolledDraft['assignments'],
    rollId: string | null,
  ) {
    setRolledDraft((current) => {
      if (current === null) {
        return current
      }

      const nextDraft = assignRolledResult(current, ability, rollId)
      const validation = validateRolledDraft(nextDraft)

      if (validation.valid) {
        setCharacter((currentCharacter) => ({
          ...currentCharacter,
          abilityScores: rolledDraftToAbilityScores(nextDraft),
        }))
      }

      return nextDraft
    })
    setSaveMessage(null)
  }

  async function handleEditionChange(nextEditionId: EditionId) {
    if (nextEditionId === character.editionId) {
      return
    }

    const needsConfirmation = await needsEditionChangeSpeciesConfirmation(
      character.species,
      nextEditionId,
      (speciesId) => speciesCatalog.getSpecies(speciesId),
    )

    if (needsConfirmation) {
      setPendingEditionId(nextEditionId)
      return
    }

    setCharacter((current) => ({ ...current, editionId: nextEditionId }))
    setSpeciesDraft(null)
    setSaveMessage(null)
  }

  function confirmEditionChange() {
    if (pendingEditionId === null) {
      return
    }

    setCharacter((current) => ({
      ...current,
      editionId: pendingEditionId,
      species: null,
    }))
    setSpeciesDraft(null)
    setPendingEditionId(null)
    setSaveMessage(null)
  }

  function cancelEditionChange() {
    setPendingEditionId(null)
  }

  async function handleSave() {
    if (!canSaveCharacterState) {
      setSaveMessage(
        speciesDraftIncomplete
          ? 'Complete the species selection before saving.'
          : character.creationMethod === 'point-buy'
            ? 'Fix the point-buy assignment before saving.'
            : character.creationMethod === 'rolled'
              ? 'Complete the rolled assignment before saving.'
              : 'Complete the standard array assignment before saving.',
      )
      return
    }

    const characterToSave = (() => {
      if (
        character.creationMethod === 'standard-array' &&
        standardArrayDraft !== null
      ) {
        return {
          ...character,
          abilityScores: standardArrayDraftToAbilityScores(standardArrayDraft),
        }
      }
      if (character.creationMethod === 'point-buy' && pointBuyDraft !== null) {
        return {
          ...character,
          abilityScores: { ...pointBuyDraft },
        }
      }
      if (character.creationMethod === 'rolled' && rolledDraft !== null) {
        return {
          ...character,
          abilityScores: rolledDraftToAbilityScores(rolledDraft),
        }
      }
      return character
    })()

    await repository.save(characterToSave)
    setCharacter(characterToSave)
    setSaveMessage('Character saved.')
  }

  if (isLoading) {
    return <p className="status">Loading character...</p>
  }

  return (
    <main className="app">
      <header>
        <h1>CharacterForge</h1>
        <p>Create a D&amp;D 5e character — ability scores and species.</p>
      </header>

      <CharacterWizard
        activeStepId={activeStepId}
        stepStatuses={stepStatuses}
        onStepChange={setActiveStepId}
        stepContent={{
          basics: (
            <BasicsStep
              name={character.name}
              editionId={character.editionId}
              onNameChange={(name) => {
                setCharacter((current) => ({ ...current, name }))
                setSaveMessage(null)
              }}
              onEditionChange={(editionId) => {
                void handleEditionChange(editionId)
              }}
              onBasicsTouched={() => setBasicsTouched(true)}
            />
          ),
        }}
      />

      <AbilityScoresForm
        creationMethod={character.creationMethod}
        abilityScores={character.abilityScores}
        standardArrayDraft={standardArrayDraft}
        pointBuyDraft={pointBuyDraft}
        rolledDraft={rolledDraft}
        prefersReducedMotion={prefersReducedMotion}
        onCreationMethodChange={(creationMethod) => {
          setAbilityScoresTouched(true)
          setCharacter((current) => ({ ...current, creationMethod }))
          setSaveMessage(null)

          if (creationMethod === 'standard-array') {
            setStandardArrayDraft(
              abilityScoresToStandardArrayDraft(character.abilityScores),
            )
            setPointBuyDraft(null)
            return
          }

          if (creationMethod === 'point-buy') {
            setPointBuyDraft(
              initializePointBuyDraftFromAbilityScores(character.abilityScores),
            )
            setStandardArrayDraft(null)
            setRolledDraft(null)
            return
          }

          if (creationMethod === 'rolled') {
            setRolledDraft(null)
            setStandardArrayDraft(null)
            setPointBuyDraft(null)
            return
          }

          setStandardArrayDraft(null)
          setPointBuyDraft(null)
          setRolledDraft(null)
        }}
        onAbilityScoreChange={(ability, value) => {
          setAbilityScoresTouched(true)
          updateAbilityScore(ability, value)
        }}
        onStandardArrayDraftChange={updateStandardArrayDraft}
        onClearStandardArray={() => {
          replaceStandardArrayDraft(createEmptyStandardArrayDraft())
        }}
        onApplyDefaultStandardArray={() => {
          replaceStandardArrayDraft(defaultStandardArrayDraft())
        }}
        onStartPointBuy={() => {
          replacePointBuyDraft(createMinimumPointBuyDraft())
        }}
        onResetPointBuy={() => {
          replacePointBuyDraft(resetPointBuyDraft())
        }}
        onAdjustPointBuyScore={updatePointBuyDraft}
        onRolledPoolReady={replaceRolledDraft}
        onRolledAssignmentChange={updateRolledAssignment}
        randomSource={randomSource}
      />

      <SpeciesPicker
        editionId={character.editionId}
        committedSelection={character.species}
        draft={speciesDraft}
        catalog={speciesCatalog}
        onDraftChange={setSpeciesDraft}
        onCommittedSelectionChange={(species) => {
          setCharacter((current) => ({ ...current, species }))
          setSaveMessage(null)
        }}
      />

      <EditionChangeDialog
        open={pendingEditionId !== null}
        onConfirm={confirmEditionChange}
        onCancel={cancelEditionChange}
      />

      <div className="actions">
        <button
          type="button"
          disabled={!canSaveCharacterState}
          onClick={() => void handleSave()}
        >
          Save character
        </button>
        {saveMessage !== null ? <p className="status">{saveMessage}</p> : null}
        {!canSaveCharacterState ? (
          <p className="status">
            {speciesDraftIncomplete
              ? 'Complete the species selection before saving.'
              : character.creationMethod === 'point-buy'
                ? 'Fix the point-buy assignment before saving.'
                : character.creationMethod === 'rolled'
                  ? 'Complete the rolled assignment before saving.'
                  : 'Complete the standard array assignment before saving.'}
          </p>
        ) : null}
      </div>
    </main>
  )
}
