import type {
  ReviewProficienciesModel,
  ReviewSaveRowModel,
  ReviewSensesModel,
  ReviewSkillRowModel,
} from '../../../buildReviewSheetModels'

function ProficiencyMarker({
  rank,
}: {
  rank: 'none' | 'proficient' | 'expertise' | boolean
}) {
  if (rank === true || rank === 'proficient') {
    return (
      <span className="review-prof-marker review-prof-marker--proficient" title="Proficient">
        <span className="review-sheet__visually-hidden">Proficient</span>
      </span>
    )
  }

  if (rank === 'expertise') {
    return (
      <span className="review-prof-marker review-prof-marker--expertise" title="Expertise">
        <span className="review-sheet__visually-hidden">Expertise</span>
      </span>
    )
  }

  return (
    <span className="review-prof-marker review-prof-marker--none" title="Not proficient">
      <span className="review-sheet__visually-hidden">Not proficient</span>
    </span>
  )
}

export function ReviewSkillsPanel({ skills }: { skills: ReviewSkillRowModel[] }) {
  return (
    <section
      className="character-sheet__panel character-sheet__panel--sheet character-sheet__panel--skills"
      aria-labelledby="overview-skills-heading"
    >
      <h4 id="overview-skills-heading" className="character-sheet__panel-title">
        Skills
      </h4>
      <div className="review-skill-list__header" aria-hidden="true">
        <span />
        <span>Mod</span>
        <span>Skill</span>
        <span>Bonus</span>
      </div>
      <ul className="review-skill-list">
        {skills.map((skill) => (
          <li key={skill.skillId} className="review-skill-list__row">
            <ProficiencyMarker rank={skill.proficiency} />
            <span className="review-skill-list__ability">{skill.abilityAbbreviation}</span>
            <span className="review-skill-list__name">{skill.name}</span>
            <span className="review-skill-list__mod">{skill.modifierLabel}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ReviewSavingThrowsPanel({
  saves,
  notes,
}: {
  saves: ReviewSaveRowModel[]
  notes: string[]
}) {
  return (
    <section
      className="character-sheet__panel character-sheet__panel--sheet"
      aria-labelledby="overview-saving-throws-heading"
    >
      <h4 id="overview-saving-throws-heading" className="character-sheet__panel-title">
        Saving Throws
      </h4>
      <ul className="review-save-grid">
        {saves.map((save) => (
          <li key={save.abilityId} className="review-save-grid__row">
            <ProficiencyMarker rank={save.proficient} />
            <span className="review-save-grid__ability">{save.abbreviation}</span>
            <span className="review-save-grid__mod">{save.modifierLabel}</span>
          </li>
        ))}
      </ul>
      {notes.length > 0 ? (
        <ul className="character-sheet__panel-notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export function ReviewSensesPanel({ senses }: { senses: ReviewSensesModel }) {
  return (
    <section
      className="character-sheet__panel character-sheet__panel--sheet"
      aria-labelledby="overview-senses-heading"
    >
      <h4 id="overview-senses-heading" className="character-sheet__panel-title">
        Senses
      </h4>
      <ul className="review-sense-list">
        {senses.passives.map((passive) => (
          <li key={passive.label} className="review-sense-list__row">
            <span className="review-sense-list__value">{passive.value}</span>
            <span className="review-sense-list__label">{passive.label}</span>
          </li>
        ))}
      </ul>
      {senses.special.length > 0 ? (
        <ul className="character-sheet__panel-notes character-sheet__panel-notes--plain">
          {senses.special.map((sense) => (
            <li key={sense.label}>
              {sense.label} {sense.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export function ReviewProficienciesPanel({
  model,
}: {
  model: ReviewProficienciesModel
}) {
  const groups = [
    { label: 'Armor', values: model.armor },
    { label: 'Weapons', values: model.weapons },
    { label: 'Tools', values: model.tools },
    { label: 'Languages', values: model.languages },
  ].filter((group) => group.values.length > 0)

  if (groups.length === 0) {
    return null
  }

  return (
    <section
      className="character-sheet__panel character-sheet__panel--sheet"
      aria-labelledby="overview-proficiencies-heading"
    >
      <h4 id="overview-proficiencies-heading" className="character-sheet__panel-title">
        Proficiencies & Training
      </h4>
      <dl className="character-sheet__proficiency-groups">
        {groups.map((group) => (
          <div key={group.label} className="character-sheet__proficiency-group">
            <dt>{group.label}</dt>
            <dd>{group.values.join(', ')}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
