import type { FinishPolicyResult } from '../../characterFinishPolicy'
import type {
  CharacterDetailsReviewSections,
  ClassReviewDisplay,
  ReviewableStepId,
  SpeciesReviewDisplay,
} from '../../reviewSummary'
import {
  hasCharacterDetailsReviewContent,
} from '../../reviewSummary'
import { CharacterDetailsReviewContent } from '../../../features/character-details/CharacterDetailsReviewContent'
import type { AbilityScores, ResolvedDeferredCharacterRequirement } from '../../../domain/types'
import type { StepStatus } from '../types'
import { AbilityScoreCards } from './review/AbilityScoreCards'
import { CharacterSheetHeader } from './review/CharacterSheetHeader'
import { CharacterSheetSection } from './review/CharacterSheetSection'
import { organizeReviewSheet } from './review/organizeReviewSheet'
import {
  DetailLines,
  FeatureList,
  StatGrid,
} from './review/ReviewSheetContentBlocks'

function SectionIcon({ label }: { label: string }) {
  return <span className="review-sheet-section-icon">{label}</span>
}

export type ReviewStepProps = {
  characterName: string
  abilityScores: AbilityScores
  speciesId: string | null
  classId: string | null
  speciesDisplay: SpeciesReviewDisplay
  classDisplay: ClassReviewDisplay
  hasSpellcastingCapability: boolean
  spellLines: string[]
  unresolvedDeferredRequirements: ResolvedDeferredCharacterRequirement[]
  stepStatuses: Record<ReviewableStepId, StepStatus>
  summaries: Record<ReviewableStepId, string[]>
  characterDetailsReview: CharacterDetailsReviewSections
  finishPolicy: FinishPolicyResult
  finishBlockedMessage: string
  finishMessage: string | null
  onEditStep: (stepId: ReviewableStepId) => void
  onFinish: () => void
}

export function ReviewStep({
  characterName,
  abilityScores,
  speciesId,
  classId,
  speciesDisplay,
  classDisplay,
  hasSpellcastingCapability,
  spellLines,
  unresolvedDeferredRequirements,
  stepStatuses,
  summaries,
  characterDetailsReview,
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
    unresolvedDeferredRequirements,
    hasSpellcastingCapability,
    spellLines,
  })

  const hasAttentionItems =
    sheet.incompleteSteps.length > 0 || sheet.deferredRequirements.length > 0

  const backgroundUsesSpecies =
    sheet.backgroundLines.some((line) => line.startsWith('Ancestry: ')) ||
    stepStatuses.species.completion !== 'complete' ||
    stepStatuses.species.hasValidationErrors

  const showCharacterDetails =
    hasCharacterDetailsReviewContent(characterDetailsReview)

  return (
    <section
      aria-labelledby="wizard-step-review-heading"
      className="wizard-step-panel review-step review-sheet"
    >
      <h2 id="wizard-step-review-heading" className="review-sheet__visually-hidden">
        Character Sheet
      </h2>

      <CharacterSheetHeader
        characterName={characterName}
        speciesId={speciesId}
        speciesName={speciesDisplay.speciesName}
        classId={classId}
        className={classDisplay.className}
      />

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

      <CharacterSheetSection
        id="review-ability-scores"
        title="Ability Scores"
        icon={<SectionIcon label="AB" />}
        status={stepStatuses['ability-scores']}
        editStepId="ability-scores"
        onEdit={onEditStep}
      >
        <AbilityScoreCards abilityScores={abilityScores} />
        {sheet.abilityScoreNotes.length > 0 ? (
          <ul className="review-sheet-notes">
            {sheet.abilityScoreNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </CharacterSheetSection>

      <CharacterSheetSection
        id="review-core-stats"
        title="Core Statistics"
        icon={<SectionIcon label="CS" />}
      >
        <StatGrid stats={sheet.coreStats} />
      </CharacterSheetSection>

      {sheet.sectionVisibility.skills ? (
        <CharacterSheetSection
          id="review-skills"
          title="Skills & Saving Throws"
          icon={<SectionIcon label="SK" />}
          status={stepStatuses.class}
          editStepId="class"
          onEdit={onEditStep}
        >
          <FeatureList items={sheet.skillsAndSaves} />
        </CharacterSheetSection>
      ) : null}

      {sheet.sectionVisibility.equipment ? (
        <CharacterSheetSection
          id="review-equipment"
          title="Equipment"
          icon={<SectionIcon label="EQ" />}
          status={stepStatuses.equipment}
          editStepId="equipment"
          onEdit={onEditStep}
        >
          <DetailLines lines={sheet.equipmentLines} />
        </CharacterSheetSection>
      ) : null}

      {sheet.sectionVisibility.features ? (
        <CharacterSheetSection
          id="review-features"
          title="Features"
          icon={<SectionIcon label="FT" />}
          status={stepStatuses.class}
          editStepId="class"
          onEdit={onEditStep}
        >
          <FeatureList items={sheet.features} />
        </CharacterSheetSection>
      ) : null}

      {sheet.sectionVisibility.spells ? (
        <CharacterSheetSection
          id="review-spells"
          title="Spells"
          icon={<SectionIcon label="SP" />}
        >
          <DetailLines lines={sheet.spellLines} />
        </CharacterSheetSection>
      ) : null}

      {sheet.sectionVisibility.background ? (
        <CharacterSheetSection
          id="review-background"
          title="Background & Personality"
          icon={<SectionIcon label="BG" />}
          status={backgroundUsesSpecies ? stepStatuses.species : stepStatuses.background}
          editStepId={backgroundUsesSpecies ? 'species' : 'background'}
          onEdit={onEditStep}
        >
          <DetailLines lines={sheet.backgroundLines} />
        </CharacterSheetSection>
      ) : null}

      {showCharacterDetails ? (
        <CharacterSheetSection
          id="review-character-details"
          title="Character Details"
          icon={<SectionIcon label="CD" />}
          status={stepStatuses['character-details']}
          editStepId="character-details"
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
