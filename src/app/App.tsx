import { createLocalStorageCharacterRepository } from '../adapters/localStorageCharacterRepository'
import { createBundledSpeciesCatalog } from '../adapters/bundledSpeciesCatalog'
import { EditionChangeDialog } from '../features/species/EditionChangeDialog'
import { AbilityScoresStep } from './wizard/steps/AbilityScoresStep'
import { BackgroundStep } from './wizard/steps/BackgroundStep'
import { BasicsStep } from './wizard/steps/BasicsStep'
import { ClassStep } from './wizard/steps/ClassStep'
import { EquipmentStep } from './wizard/steps/EquipmentStep'
import { ReviewStep } from './wizard/steps/ReviewStep'
import { SpeciesStep } from './wizard/steps/SpeciesStep'
import { CharacterWizard } from './wizard/CharacterWizard'
import { useCharacterEditor } from './hooks/useCharacterEditor'
import './app.css'

const repository = createLocalStorageCharacterRepository()
const speciesCatalog = createBundledSpeciesCatalog()

type AppProps = {
  randomSource?: () => number
}

export default function App({ randomSource = Math.random }: AppProps) {
  const editor = useCharacterEditor({
    repository,
    speciesCatalog,
    randomSource,
  })

  if (editor.isLoading) {
    return <p className="status">Loading character...</p>
  }

  const { character, abilityScores, species } = editor

  return (
    <main className="app">
      <header>
        <h1>CharacterForge</h1>
        <p>Create a D&amp;D 5e character — ability scores and species.</p>
      </header>

      <CharacterWizard
        activeStepId={editor.activeStepId}
        stepStatuses={editor.stepStatuses}
        onStepChange={editor.setActiveStepId}
        stepContent={{
          basics: (
            <BasicsStep
              name={character.name}
              editionId={character.editionId}
              onNameChange={editor.updateName}
              onEditionChange={(editionId) => {
                void species.handleEditionChange(editionId)
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
              onDraftChange={species.setSpeciesDraft}
              onCommittedSelectionChange={species.commitSpeciesSelection}
            />
          ),
          class: <ClassStep />,
          'ability-scores': (
            <AbilityScoresStep
              creationMethod={character.creationMethod}
              abilityScores={character.abilityScores}
              standardArrayDraft={abilityScores.standardArrayDraft}
              pointBuyDraft={abilityScores.pointBuyDraft}
              rolledDraft={abilityScores.rolledDraft}
              prefersReducedMotion={editor.prefersReducedMotion}
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
          background: <BackgroundStep />,
          equipment: <EquipmentStep />,
          review: (
            <ReviewStep
              stepStatuses={{
                basics: editor.stepStatuses.basics,
                species: editor.stepStatuses.species,
                class: editor.stepStatuses.class,
                'ability-scores': editor.stepStatuses['ability-scores'],
                background: editor.stepStatuses.background,
                equipment: editor.stepStatuses.equipment,
              }}
              summaries={editor.reviewSummaries}
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
        open={species.pendingEditionId !== null}
        onConfirm={species.confirmEditionChange}
        onCancel={species.cancelEditionChange}
      />

      <div className="actions">
        <button
          type="button"
          disabled={!editor.canSaveCharacterState}
          onClick={() => void editor.handleSaveDraft()}
        >
          Save draft
        </button>
        {editor.saveMessage !== null ? (
          <p className="status">{editor.saveMessage}</p>
        ) : null}
        {!editor.canSaveCharacterState ? (
          <p className="status">{editor.saveBlockedMessage}</p>
        ) : null}
      </div>
    </main>
  )
}
