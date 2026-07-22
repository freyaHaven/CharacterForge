import { useCallback, useEffect, useState } from 'react'
import {
  formatCharacterFileError,
  parseCharacterFile,
  readCharacterFileText,
} from '../adapters/characterFile'
import { createLocalStorageCharacterRepository } from '../adapters/localStorageCharacterRepository'
import { createRecentTrackingRepository } from '../adapters/recentTrackingCharacterRepository'
import { createBundledBackgroundCatalog } from '../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../adapters/bundledSpeciesCatalog'
import { EditionChangeDialog } from '../features/species/EditionChangeDialog'
import { CharacterContextSummary } from '../features/character/CharacterContextSummary'
import { HomePage } from './HomePage'
import { useCharacterEditor } from './hooks/useCharacterEditor'
import {
  activateEditorSession,
  clearEditorSession,
  ACTIVE_CHARACTER_ID_KEY,
} from './session/editorSession'
import { deleteSavedCharacter } from './session/deleteSavedCharacter'
import { loadRecentCharacterSummaries } from './session/loadRecentCharacterSummaries'
import type { RecentCharacterSummary } from './session/recentCharacterDisplay'
import { recentCharactersStore } from './session/recentCharacters'
import { AbilityScoresStep } from './wizard/steps/AbilityScoresStep'
import { BackgroundStep } from './wizard/steps/BackgroundStep'
import { BasicsStep } from './wizard/steps/BasicsStep'
import { ClassStep } from './wizard/steps/ClassStep'
import { EquipmentStep } from './wizard/steps/EquipmentStep'
import { FeatsStep } from './wizard/steps/FeatsStep'
import { SpellsStep } from './wizard/steps/SpellsStep'
import { ReviewStep } from './wizard/steps/ReviewStep'
import { SpeciesStep } from './wizard/steps/SpeciesStep'
import { CharacterWizard } from './wizard/CharacterWizard'
import { WizardEditorActions } from './wizard/WizardEditorActions'
import { getAlignmentLabel } from '../domain/character/alignment'
import { getPronounLabel } from '../domain/character/pronouns'
import './app.css'

const baseRepository = createLocalStorageCharacterRepository()
const repository = createRecentTrackingRepository(
  baseRepository,
  recentCharactersStore,
)
const speciesCatalog = createBundledSpeciesCatalog()
const classCatalog = createBundledClassCatalog()
const backgroundCatalog = createBundledBackgroundCatalog()
const featCatalog = createBundledFeatCatalog()

type AppView = 'home' | 'editor'

type AppProps = {
  randomSource?: () => number
}

export default function App({ randomSource = Math.random }: AppProps) {
  const [appView, setAppView] = useState<AppView>('home')
  const [importError, setImportError] = useState<string | null>(null)
  const [recentCharacters, setRecentCharacters] = useState<
    RecentCharacterSummary[]
  >([])

  const editor = useCharacterEditor({
    repository,
    speciesCatalog,
    classCatalog,
    backgroundCatalog,
    featCatalog,
    randomSource,
    restoreFromStorage: false,
  })

  const refreshRecentCharacters = useCallback(async () => {
    const summaries = await loadRecentCharacterSummaries({
      recentStore: recentCharactersStore,
      repository,
      speciesCatalog,
      classCatalog,
    })
    setRecentCharacters(summaries)
  }, [])

  useEffect(() => {
    if (appView !== 'home') {
      return
    }

    void refreshRecentCharacters()
  }, [appView, refreshRecentCharacters])

  const handleCreateNew = useCallback(async () => {
    setImportError(null)
    activateEditorSession()
    await editor.startNewCharacter()
    setAppView('editor')
  }, [editor])

  const handleImportFile = useCallback(
    async (file: File) => {
      setImportError(null)

      try {
        const content = await readCharacterFileText(file)
        const result = parseCharacterFile(content)

        if (!result.ok) {
          setImportError(formatCharacterFileError(result.reason))
          return
        }

        activateEditorSession(result.character.id)
        await editor.importCharacter(result.character)
        setAppView('editor')
      } catch {
        setImportError('The selected file could not be read.')
      }
    },
    [editor],
  )

  const handleContinue = useCallback(
    async (characterId: string) => {
      setImportError(null)
      activateEditorSession(characterId)
      const opened = await editor.openCharacter(characterId)

      if (!opened) {
        recentCharactersStore.remove(characterId)
        await refreshRecentCharacters()
        setImportError('That character could not be found.')
        return
      }

      setAppView('editor')
    },
    [editor, refreshRecentCharacters],
  )

  const handleDelete = useCallback(
    async (characterId: string) => {
      setImportError(null)
      await deleteSavedCharacter({
        characterId,
        repository,
        recentStore: recentCharactersStore,
      })

      if (sessionStorage.getItem(ACTIVE_CHARACTER_ID_KEY) === characterId) {
        clearEditorSession()
        setAppView('home')
      }

      await refreshRecentCharacters()
    },
    [refreshRecentCharacters],
  )

  const [backgroundSkillIds, setBackgroundSkillIds] = useState<string[]>([])

  useEffect(() => {
    let isActive = true
    const backgroundId = editor.character.background?.backgroundId
    if (backgroundId === undefined) {
      setBackgroundSkillIds([])
      return
    }

    void backgroundCatalog.getBackground(backgroundId).then((definition) => {
      if (!isActive) {
        return
      }
      setBackgroundSkillIds(
        definition === null ? [] : [...definition.skillProficiencies],
      )
    })

    return () => {
      isActive = false
    }
  }, [editor.character.background?.backgroundId])

  if (editor.isLoading) {
    return <p className="status">Loading character...</p>
  }

  const {
    character,
    abilityScores,
    species,
    classEditor,
    background,
    feat,
    editionChange,
  } = editor

  return (
    <main className="app">
      <header className="app-brand">
        <div className="app-brand__identity">
          <h1>CharacterForge</h1>
          <p className="app-brand__tagline">A modern D&amp;D character creator.</p>
        </div>
        {appView === 'editor' ? (
          <div className="app-brand__actions">
            <WizardEditorActions
              importError={importError}
              onImportFile={(file) => {
                void handleImportFile(file)
              }}
              onExportCharacter={editor.handleExportCharacter}
            />
          </div>
        ) : null}
      </header>

      {appView === 'home' ? (
        <HomePage
          importError={importError}
          recentCharacters={recentCharacters}
          onCreateNew={() => {
            void handleCreateNew()
          }}
          onImportFile={(file) => {
            void handleImportFile(file)
          }}
          onContinue={(characterId) => {
            void handleContinue(characterId)
          }}
          onDelete={(characterId) => {
            void handleDelete(characterId)
          }}
        />
      ) : (
        <>
          <CharacterWizard
            activeStepId={editor.activeStepId}
            stepContext={editor.wizardStepContext}
            stepStatuses={editor.stepStatuses}
            onStepChange={editor.setActiveStepId}
            characterContext={
              <CharacterContextSummary
                character={character}
                activeStepId={editor.activeStepId}
                speciesCatalog={editor.speciesCatalog}
                classCatalog={editor.classCatalog}
                speciesDraft={species.speciesDraft}
                classDrafts={classEditor.classDrafts}
              />
            }
            stepContent={{
              basics: (
                <BasicsStep
                  name={character.name}
                  editionId={character.editionId}
                  onNameChange={editor.updateName}
                  onEditionChange={(editionId) => {
                    void editionChange.handleEditionChange(editionId)
                  }}
                  onBasicsTouched={() => editor.setBasicsTouched(true)}
                />
              ),
              species: (
                <SpeciesStep
                  editionId={character.editionId}
                  committedSelection={character.species}
                  draft={species.speciesDraft}
                  catalog={editor.speciesCatalog}
                  featCatalog={editor.featCatalog}
                  takenFeatIds={species.takenFeatIds}
                  onDraftChange={species.setSpeciesDraft}
                  onCommittedSelectionChange={species.commitSpeciesSelection}
                />
              ),
              'ability-scores': (
                <AbilityScoresStep
                  creationMethod={character.creationMethod}
                  abilityScores={character.abilityScores}
                  standardArrayDraft={abilityScores.standardArrayDraft}
                  pointBuyDraft={abilityScores.pointBuyDraft}
                  rolledDraft={abilityScores.rolledDraft}
                  prefersReducedMotion={editor.prefersReducedMotion}
                  backgroundSelection={character.background}
                  onCreationMethodChange={abilityScores.handleCreationMethodChange}
                  onAbilityScoreChange={abilityScores.updateAbilityScore}
                  onStandardArrayDraftChange={abilityScores.updateStandardArrayDraft}
                  onClearStandardArray={abilityScores.clearStandardArrayDraft}
                  onApplyDefaultStandardArray={abilityScores.applyDefaultStandardArray}
                  onStartPointBuy={abilityScores.startPointBuy}
                  onResetPointBuy={abilityScores.resetPointBuy}
                  onAdjustPointBuyScore={abilityScores.updatePointBuyDraft}
                  onRolledPoolReady={abilityScores.replaceRolledDraft}
                  onRolledAssignmentChange={abilityScores.updateRolledAssignment}
                  randomSource={editor.randomSource}
                />
              ),
              class: (
                <ClassStep
                  editionId={character.editionId}
                  buildMode={classEditor.buildMode}
                  targetLevel={classEditor.targetLevel}
                  committedClasses={classEditor.committedClasses}
                  classDrafts={classEditor.classDrafts}
                  startingClassInstanceId={classEditor.startingClassInstanceId}
                  activeInstanceId={classEditor.activeInstanceId}
                  draft={classEditor.classDraft}
                  abilityScores={character.abilityScores}
                  speciesSelection={character.species}
                  backgroundSkillIds={backgroundSkillIds}
                  catalog={editor.classCatalog}
                  speciesCatalog={editor.speciesCatalog}
                  featCatalog={featCatalog}
                  characterFeatId={character.feat?.featId ?? null}
                  multiclassValidationIssues={
                    classEditor.multiclassValidationIssues
                  }
                  onBuildModeChange={classEditor.setBuildMode}
                  onReturnToClassPathIntro={classEditor.returnToClassPathIntro}
                  onSwitchToMulticlass={classEditor.switchToMulticlass}
                  onSwitchToSingleClass={classEditor.switchToSingleClass}
                  onSyncTargetLevel={classEditor.syncTargetLevel}
                  onActiveInstanceChange={classEditor.setActiveInstanceId}
                  onDraftChange={classEditor.setClassDraft}
                  onCommitInstance={classEditor.commitClassInstance}
                  onRemoveInstance={classEditor.removeClassInstance}
                  onStartingClassChange={classEditor.setStartingClass}
                  onSelectOrAddClass={(classDefinition) =>
                    classEditor.selectOrAddClass(classDefinition.id)
                  }
                  onToggleMulticlassClass={classEditor.toggleMulticlassClass}
                  onMulticlassInstanceLevelChange={
                    classEditor.setMulticlassInstanceLevel
                  }
                />
              ),
              background: (
                <BackgroundStep
                  editionId={character.editionId}
                  committedSelection={character.background}
                  draft={background.backgroundDraft}
                  catalog={editor.backgroundCatalog}
                  featCatalog={editor.featCatalog}
                  onDraftChange={background.setBackgroundDraft}
                  onCommittedSelectionChange={background.commitBackgroundSelection}
                  speciesSelection={character.species}
                  details={character.details}
                  speciesCatalog={editor.speciesCatalog}
                  onDetailsChange={editor.updateDetails}
                  onDetailsTouched={() => editor.setDetailsTouched(true)}
                />
              ),
              equipment: (
                <EquipmentStep
                  resolved={editor.resolvedEquipment}
                  selections={character.equipment.selections}
                  onChangeSelections={editor.setEquipmentSelections}
                  validationIssues={
                    editor.equipmentValidation?.ok === false
                      ? editor.equipmentValidation.issues
                      : []
                  }
                  equipmentCatalog={editor.equipmentCatalog}
                  editionId={character.editionId}
                />
              ),
              feats: (
                <FeatsStep
                  editionId={character.editionId}
                  committedSelection={character.feat}
                  draft={feat.featDraft}
                  catalog={editor.featCatalog}
                  onDraftChange={feat.setFeatDraft}
                  onCommittedSelectionChange={feat.commitFeatSelection}
                />
              ),
              spells: (
                <SpellsStep
                  summary={editor.spellcastingReview}
                  spellSourceStates={character.spellSourceStates}
                  onChangeSpellSourceStates={editor.setSpellSourceStates}
                  spellCatalog={editor.spellCatalog}
                  validationIssues={
                    editor.spellValidation?.ok === false
                      ? editor.spellValidation.issues
                      : []
                  }
                />
              ),
              review: (
                <ReviewStep
                  characterName={character.name}
                  abilityScores={character.abilityScores}
                  speciesId={
                    species.speciesDraft?.speciesId ??
                    character.species?.speciesId ??
                    null
                  }
                  speciesDisplay={editor.speciesReviewDisplay}
                  classDisplay={editor.classReviewDisplay}
                  sheetModels={editor.reviewSheetModels}
                  pronounsLabel={
                    character.details.pronouns !== null
                      ? getPronounLabel(character.details.pronouns)
                      : null
                  }
                  age={
                    character.details.age.trim().length > 0
                      ? character.details.age.trim()
                      : null
                  }
                  alignmentLabel={
                    character.details.alignment !== null
                      ? getAlignmentLabel(character.details.alignment)
                      : null
                  }
                  hasSpellcastingCapability={
                    editor.spellcastingReview.hasSpellcastingCapability
                  }
                  spellLines={editor.spellcastingReview.spellLines}
                  unresolvedDeferredRequirements={
                    editor.unresolvedDeferredRequirements
                  }
                  stepStatuses={{
                    basics: editor.stepStatuses.basics,
                    species: editor.stepStatuses.species,
                    'ability-scores': editor.stepStatuses['ability-scores'],
                    class: editor.stepStatuses.class,
                    background: editor.stepStatuses.background,
                    equipment: editor.stepStatuses.equipment,
                    feats: editor.stepStatuses.feats,
                    spells: editor.stepStatuses.spells,
                  }}
                  summaries={editor.reviewSummaries}
                  characterDetailsReview={editor.characterDetailsReviewSections}
                  characterDetailsStatus={editor.characterDetailsStatus}
                  equipmentEntries={editor.ownedEquipment.entries}
                  equipmentInventory={editor.ownedEquipment.inventory}
                  equipmentWeightCarriedLb={
                    editor.ownedEquipment.weightCarriedLb
                  }
                  equipmentGoldPieces={
                    editor.ownedEquipment.currency.goldPieces
                  }
                  equipmentLoadout={character.equipment.loadout}
                  equipmentCatalog={editor.equipmentCatalog}
                  onChangeEquipmentLoadout={editor.setEquipmentLoadout}
                  finishPolicy={editor.finishPolicy}
                  finishBlockedMessage={editor.finishBlockedMessage}
                  finishMessage={editor.finishMessage}
                  onEditStep={editor.setActiveStepId}
                  onFinish={() => void editor.handleFinish()}
                />
              ),
            }}
          />

          <EditionChangeDialog
            open={editionChange.pendingEditionChange !== null}
            clearsSpecies={
              editionChange.pendingEditionChange?.clearsSpecies ?? false
            }
            clearsClass={editionChange.pendingEditionChange?.clearsClass ?? false}
            clearsBackground={
              editionChange.pendingEditionChange?.clearsBackground ?? false
            }
            clearsFeat={
              editionChange.pendingEditionChange?.clearsFeat ?? false
            }
            onConfirm={editionChange.confirmEditionChange}
            onCancel={editionChange.cancelEditionChange}
          />
        </>
      )}
    </main>
  )
}
