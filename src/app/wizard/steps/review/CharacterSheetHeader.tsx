import type { ClassReviewEntry } from '../../../reviewSummary'
import { ClassIcon } from '../../../../features/class/ClassIcon'
import { SpeciesIcon } from '../../../../features/species/SpeciesIcon'

export type CharacterSheetHeaderProps = {
  characterName: string
  speciesId: string | null
  speciesName: string | null
  pronounsLabel: string | null
  age: string | null
  alignmentLabel: string | null
  classEntries: ClassReviewEntry[]
  characterLevel: number | null
}

function formatIdentityMeta(
  age: string | null,
  alignmentLabel: string | null,
  speciesName: string | null,
): string | null {
  const parts: string[] = []

  if (age !== null) {
    parts.push(`Age ${age}`)
  }

  if (alignmentLabel !== null) {
    parts.push(alignmentLabel)
  }

  if (speciesName !== null) {
    parts.push(speciesName)
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export function CharacterSheetHeader({
  characterName,
  speciesId,
  speciesName,
  pronounsLabel,
  age,
  alignmentLabel,
  classEntries,
  characterLevel,
}: CharacterSheetHeaderProps) {
  const trimmedName = characterName.trim()
  const displayName =
    trimmedName.length > 0 ? trimmedName : 'Unnamed Character'
  const metaLine = formatIdentityMeta(age, alignmentLabel, speciesName)
  const isMulticlass = classEntries.length > 1

  return (
    <header className="character-sheet__header" aria-label="Character identity">
      <div className="character-sheet__portrait" aria-hidden={speciesId === null}>
        {speciesId !== null ? (
          <SpeciesIcon
            speciesId={speciesId}
            className="character-sheet__portrait-icon"
          />
        ) : (
          <span className="character-sheet__portrait-placeholder" aria-hidden="true">
            ?
          </span>
        )}
      </div>

      <div className="character-sheet__identity">
        <h2 className="character-sheet__name">
          {displayName}
          {pronounsLabel !== null ? (
            <>
              {' '}
              <span className="character-sheet__pronouns">({pronounsLabel})</span>
            </>
          ) : null}
        </h2>
        {metaLine !== null ? (
          <p className="character-sheet__meta">{metaLine}</p>
        ) : null}
        {characterLevel !== null ? (
          <p className="character-sheet__level-line">Level {characterLevel}</p>
        ) : null}
      </div>

      {classEntries.length > 0 ? (
        <aside className="character-sheet__class-summary" aria-label="Class summary">
          <ul className="character-sheet__class-list">
            {classEntries.map((entry) => (
              <li
                key={`${entry.classId}-${entry.level}`}
                className="character-sheet__class-entry"
              >
                <span className="character-sheet__class-icon" aria-hidden="true">
                  <ClassIcon classId={entry.classId} />
                </span>
                <div className="character-sheet__class-copy">
                  <p className="character-sheet__class-name">{entry.className}</p>
                  {isMulticlass ? (
                    <p className="character-sheet__class-level">Level {entry.level}</p>
                  ) : null}
                  {entry.subclassName !== null ? (
                    <p className="character-sheet__class-subclass">
                      {entry.subclassName}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {isMulticlass && characterLevel !== null ? (
            <p className="character-sheet__character-level">
              Character level {characterLevel}
            </p>
          ) : null}
        </aside>
      ) : null}
    </header>
  )
}
