import type { ReactNode } from 'react'
import type { FinishPolicyResult } from '../../characterFinishPolicy'
import type {
  CharacterDetailsReviewSections,
  ClassReviewDisplay,
  ReviewableStepId,
  SpeciesReviewDisplay,
} from '../../reviewSummary'
import { hasCharacterDetailsReviewContent } from '../../reviewSummary'
import { CharacterDetailsReviewContent } from '../../../features/character-details/CharacterDetailsReviewContent'
import type {
  AbilityScores,
  EquipmentLoadout,
  ResolvedDeferredCharacterRequirement,
} from '../../../domain/types'
import type { EquipmentCatalog } from '../../../domain/ports/equipmentCatalog'
import type { ReviewSheetModels } from '../../buildReviewSheetModels'
import type {
  ResolvedInventoryEntry,
  ResolvedInventoryItem,
} from '../../../rules/character/resolveCharacterEquipment'
import { InventoryPanel } from '../../../features/equipment/InventoryPanel'
import { EquipmentStatusPanel } from '../../../features/equipment/EquipmentStatusPanel'
import { useEquipmentDefinitions } from '../../../features/equipment/useEquipmentDefinitions'
import { deriveEquipmentStatusWarnings } from '../../../domain/equipment/equipmentStatusWarnings'
import type { StepStatus } from '../types'
import { AbilityScoreCards } from './review/AbilityScoreCards'
import { CharacterSheetHeader } from './review/CharacterSheetHeader'
import { CharacterSheetSection } from './review/CharacterSheetSection'
import { CombatStatSummary } from './review/CombatStatSummary'
import { OverviewFeaturesPanel } from './review/OverviewFeaturesPanel'
import { organizeReviewSheet } from './review/organizeReviewSheet'
import {
  ReviewProficienciesPanel,
  ReviewSavingThrowsPanel,
  ReviewSensesPanel,
  ReviewSkillsPanel,
} from './review/ReviewMechanicalPanels'
import { DetailLines } from './review/ReviewSheetContentBlocks'

export type ReviewStepProps = {
  characterName: string
  abilityScores: AbilityScores
  speciesId: string | null
  speciesDisplay: SpeciesReviewDisplay
  classDisplay: ClassReviewDisplay
  sheetModels: ReviewSheetModels
  pronounsLabel: string | null
  age: string | null
  alignmentLabel: string | null
  hasSpellcastingCapability: boolean
  spellLines: string[]
  unresolvedDeferredRequirements: ResolvedDeferredCharacterRequirement[]
  stepStatuses: Record<ReviewableStepId, StepStatus>
  summaries: Record<ReviewableStepId, string[]>
  characterDetailsReview: CharacterDetailsReviewSections
  /** Optional details completeness for Overview display (not a wizard step). */
  characterDetailsStatus: StepStatus
  equipmentEntries: readonly ResolvedInventoryEntry[]
  equipmentInventory: readonly ResolvedInventoryItem[]
  equipmentWeightCarriedLb: number
  equipmentGoldPieces: number
  equipmentLoadout: EquipmentLoadout
  equipmentCatalog: EquipmentCatalog
  onChangeEquipmentLoadout: (next: EquipmentLoadout) => void
  finishPolicy: FinishPolicyResult
  finishBlockedMessage: string
  finishMessage: string | null
  onEditStep: (stepId: ReviewableStepId) => void
  onFinish: () => void
}

function SheetRegion({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      className="character-sheet__region"
      aria-labelledby={`${id}-heading`}
    >
      <h3 id={`${id}-heading`} className="character-sheet__region-title">
        {title}
      </h3>
      <div className="character-sheet__region-body">{children}</div>
    </section>
  )
}

export function ReviewStep({
  characterName,
  abilityScores,
  speciesId,
  speciesDisplay,
  classDisplay,
  sheetModels,
  pronounsLabel,
  age,
  alignmentLabel,
  hasSpellcastingCapability,
  spellLines,
  unresolvedDeferredRequirements,
  stepStatuses,
  summaries,
  characterDetailsReview,
  characterDetailsStatus,
  equipmentEntries,
  equipmentInventory,
  equipmentWeightCarriedLb,
  equipmentGoldPieces,
  equipmentLoadout,
  equipmentCatalog,
  onChangeEquipmentLoadout,
  finishPolicy,
  finishBlockedMessage,
  finishMessage,
  onEditStep,
  onFinish,
}: ReviewStepProps) {
  const sheet = organizeReviewSheet({
    summaries,
    stepStatuses,
    speciesDisplay,
    classDisplay,
    sheetModels,
    unresolvedDeferredRequirements,
    hasSpellcastingCapability,
    spellLines,
    hasEquipmentInventory:
      equipmentEntries.length > 0 || equipmentGoldPieces > 0,
  })

  const equipmentDefinitions = useEquipmentDefinitions(
    equipmentInventory,
    equipmentCatalog,
  )

  const equipmentStatusWarnings = deriveEquipmentStatusWarnings(
    equipmentInventory.map((item) => item.itemId),
    equipmentLoadout,
    equipmentDefinitions,
  )

  const hasAttentionItems =
    sheet.incompleteSteps.length > 0 || sheet.deferredRequirements.length > 0

  const showCharacterDetails =
    hasCharacterDetailsReviewContent(characterDetailsReview)

  const combatStats = [
    { label: 'Hit Points', value: sheetModels.hitPointMaximumLabel },
    { label: 'Armor Class', value: sheetModels.armorClassLabel },
    { label: 'Initiative', value: sheetModels.initiativeLabel },
    { label: 'Speed', value: sheetModels.speedLabel ?? '—' },
  ]

  return (
    <section
      aria-labelledby="wizard-step-review-heading"
      className="wizard-step-panel review-step character-sheet"
    >
      <h2 id="wizard-step-review-heading" className="review-sheet__visually-hidden">
        Character Overview
      </h2>

      {hasAttentionItems ? (
        <aside className="review-sheet-alerts" aria-label="Character completion alerts">
          {sheet.incompleteSteps.length > 0 ? (
            <p className="review-sheet-alerts__message" role="status">
              Some sections still need attention before you can finish your character.
            </p>
          ) : null}
          {sheet.deferredRequirements.length > 0 ? (
            <div className="review-sheet-alerts__deferred">
              <p className="review-sheet-alerts__deferred-title">
                Remaining character decisions
              </p>
              <ul className="review-sheet-alerts__deferred-list">
                {sheet.deferredRequirements.map((requirement) => (
                  <li key={requirement.requirementId}>{requirement.description}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      ) : null}

      <div className="character-sheet__top">
        <CharacterSheetHeader
          characterName={characterName}
          speciesId={speciesId}
          speciesName={speciesDisplay.speciesName}
          pronounsLabel={pronounsLabel}
          age={age}
          alignmentLabel={alignmentLabel}
          classEntries={classDisplay.entries}
          characterLevel={classDisplay.characterLevel}
        />

        <CombatStatSummary stats={combatStats} />
      </div>

      <SheetRegion id="overview-statistics" title="Statistics">
        <div className="character-sheet__statistics">
          <div className="character-sheet__abilities-block">
            <div className="character-sheet__abilities-header">
              <h4 className="character-sheet__panel-title">Ability Scores</h4>
              <p className="character-sheet__proficiency-chip">
                Proficiency {sheetModels.proficiencyBonusLabel}
              </p>
              <button
                type="button"
                className="review-sheet-section__edit"
                onClick={() => onEditStep('ability-scores')}
                aria-label="Edit ability scores"
              >
                Edit
              </button>
            </div>
            <AbilityScoreCards abilityScores={abilityScores} />
          </div>

          <div className="character-sheet__saves-skills">
            <div className="character-sheet__saves-column">
              <ReviewSavingThrowsPanel
                saves={sheetModels.savingThrows}
                notes={sheetModels.savingThrowNotes}
              />
              <ReviewSensesPanel senses={sheetModels.senses} />
              <ReviewProficienciesPanel model={sheetModels.proficiencies} />
            </div>
            <div className="character-sheet__skills-column">
              <ReviewSkillsPanel skills={sheetModels.skills} />
            </div>
          </div>
        </div>
      </SheetRegion>

      <OverviewFeaturesPanel
        species={sheetModels.species}
        background={sheetModels.background}
        feats={sheetModels.feats}
        classFeatures={sheet.features}
        onEditSpecies={() => onEditStep('species')}
        onEditBackground={() => onEditStep('background')}
        onEditClass={() => onEditStep('class')}
      />

      {sheet.sectionVisibility.equipment ? (
        <CharacterSheetSection
          id="overview-equipment"
          title="Inventory"
          status={stepStatuses.equipment}
          editStepId="inventory"
          editLabel="Manage Inventory"
          onEdit={onEditStep}
        >
          <EquipmentStatusPanel warnings={equipmentStatusWarnings} />
          <InventoryPanel
            entries={equipmentEntries}
            loadout={equipmentLoadout}
            weightCarriedLb={equipmentWeightCarriedLb}
            goldPieces={equipmentGoldPieces}
            abilityScores={abilityScores}
            definitionsById={equipmentDefinitions}
            onChangeLoadout={onChangeEquipmentLoadout}
          />
        </CharacterSheetSection>
      ) : null}

      {sheet.sectionVisibility.spells ? (
        <CharacterSheetSection id="overview-spellcasting" title="Spellcasting">
          <DetailLines lines={sheet.spellLines} />
        </CharacterSheetSection>
      ) : null}

      {showCharacterDetails ? (
        <CharacterSheetSection
          id="overview-character-details"
          title="Character Details"
          status={characterDetailsStatus}
          editStepId="background"
          onEdit={onEditStep}
        >
          <CharacterDetailsReviewContent sections={characterDetailsReview} />
        </CharacterSheetSection>
      ) : null}

      <div className="review-sheet-finish">
        <button
          type="button"
          className="review-sheet-finish__button"
          disabled={!finishPolicy.canFinish}
          onClick={onFinish}
        >
          Finish character
        </button>
        {!finishPolicy.canFinish ? (
          <p className="review-sheet-finish__hint" role="status">
            {finishBlockedMessage}
          </p>
        ) : null}
        {finishMessage !== null ? (
          <p className="review-sheet-finish__message" role="status" aria-live="polite">
            {finishMessage}
          </p>
        ) : null}
      </div>
    </section>
  )
}
