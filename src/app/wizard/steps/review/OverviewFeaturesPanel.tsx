import type { ReactNode } from 'react'
import type { ReviewFeatureItem } from './organizeReviewSheet'
import type {
  ReviewBackgroundCardModel,
  ReviewFeatCardModel,
  ReviewSpeciesCardModel,
} from '../../../buildReviewSheetModels'
import { FeatureList } from './ReviewSheetContentBlocks'

export type OverviewFeaturesPanelProps = {
  species: ReviewSpeciesCardModel | null
  background: ReviewBackgroundCardModel | null
  feats: ReviewFeatCardModel[]
  classFeatures: ReviewFeatureItem[]
  onEditSpecies?: () => void
  onEditBackground?: () => void
  onEditClass?: () => void
}

function FeatureGroup({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string
  editLabel?: string
  onEdit?: () => void
  children: ReactNode
}) {
  return (
    <div className="character-sheet__feature-group">
      <div className="character-sheet__feature-group-header">
        <h4 className="character-sheet__feature-group-title">{title}</h4>
        {onEdit !== undefined ? (
          <button
            type="button"
            className="review-sheet-section__edit"
            onClick={onEdit}
            aria-label={editLabel ?? `Edit ${title}`}
          >
            Edit
          </button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function featEditAction(
  feat: ReviewFeatCardModel,
  onEditBackground?: () => void,
  onEditClass?: () => void,
): { label: string; onEdit: (() => void) | undefined } {
  switch (feat.source) {
    case 'background-origin':
      return { label: 'Edit background', onEdit: onEditBackground }
    case 'class-feat-grant':
      return { label: 'Edit class', onEdit: onEditClass }
    case 'selection':
      return { label: 'Edit feat', onEdit: undefined }
  }
}

export function OverviewFeaturesPanel({
  species,
  background,
  feats,
  classFeatures,
  onEditSpecies,
  onEditBackground,
  onEditClass,
}: OverviewFeaturesPanelProps) {
  const hasContent =
    species !== null ||
    background !== null ||
    feats.length > 0 ||
    classFeatures.length > 0

  if (!hasContent) {
    return null
  }

  return (
    <section
      className="character-sheet__region"
      aria-labelledby="overview-features-heading"
    >
      <h3 id="overview-features-heading" className="character-sheet__region-title">
        Features
      </h3>

      <div className="character-sheet__feature-groups">
        {species !== null ? (
          <FeatureGroup
            title={`Species · ${species.name}`}
            editLabel="Edit species"
            onEdit={onEditSpecies}
          >
            {species.ancestryLabel !== null ? (
              <dl className="character-sheet__feature-details">
                <div>
                  <dt>Ancestry</dt>
                  <dd>{species.ancestryLabel}</dd>
                </div>
              </dl>
            ) : null}
            {species.traits.length > 0 ? (
              <ul className="character-sheet__feature-list">
                {species.traits.map((trait) => (
                  <li key={trait.id}>
                    <strong>{trait.name}.</strong> {trait.description}
                  </li>
                ))}
              </ul>
            ) : null}
          </FeatureGroup>
        ) : null}

        {background !== null ? (
          <FeatureGroup
            title={`Background · ${background.name}`}
            editLabel="Edit background"
            onEdit={onEditBackground}
          >
            <dl className="character-sheet__feature-details">
              {background.abilityScoreBenefits !== null ? (
                <div>
                  <dt>Ability Scores</dt>
                  <dd>{background.abilityScoreBenefits}</dd>
                </div>
              ) : null}
              {background.skillProficiencies.length > 0 ? (
                <div>
                  <dt>Skills</dt>
                  <dd>{background.skillProficiencies.join(', ')}</dd>
                </div>
              ) : null}
              {background.toolProficiency !== null ? (
                <div>
                  <dt>Tool</dt>
                  <dd>{background.toolProficiency}</dd>
                </div>
              ) : null}
              {background.otherBenefits.map((benefit) => (
                <div key={`${benefit.label}-${benefit.value}`}>
                  <dt>{benefit.label}</dt>
                  <dd>{benefit.value}</dd>
                </div>
              ))}
            </dl>
          </FeatureGroup>
        ) : null}

        {feats.map((feat, index) => {
          const edit = featEditAction(feat, onEditBackground, onEditClass)
          const sourceSuffix =
            feat.sourceLabel !== null && feat.sourceLabel.length > 0
              ? ` · ${feat.sourceLabel}`
              : ''

          return (
            <FeatureGroup
              key={`${feat.source}-${feat.name}-${index}`}
              title={`Feats · ${feat.name}${sourceSuffix}`}
              editLabel={edit.label}
              onEdit={edit.onEdit}
            >
              <p className="character-sheet__feature-summary">{feat.description}</p>
              {feat.prerequisite !== null ? (
                <p className="character-sheet__feature-summary">
                  Prerequisite: {feat.prerequisite}
                </p>
              ) : null}
              {feat.choices.length > 0 ? (
                <dl className="character-sheet__feature-details">
                  {feat.choices.map((choice) => (
                    <div key={choice.prompt}>
                      <dt>{choice.prompt}</dt>
                      <dd>{choice.summary}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </FeatureGroup>
          )
        })}

        {classFeatures.length > 0 ? (
          <FeatureGroup
            title="Class Features"
            editLabel="Edit class"
            onEdit={onEditClass}
          >
            <FeatureList items={classFeatures} />
          </FeatureGroup>
        ) : null}
      </div>
    </section>
  )
}
