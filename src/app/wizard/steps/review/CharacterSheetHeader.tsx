import { ClassIcon } from '../../../../features/class/ClassIcon'
import { SpeciesIcon } from '../../../../features/species/SpeciesIcon'

export type CharacterSheetHeaderProps = {
  characterName: string
  speciesId: string | null
  speciesName: string | null
  classId: string | null
  className: string | null
}

export function CharacterSheetHeader({
  characterName,
  speciesId,
  speciesName,
  classId,
  className,
}: CharacterSheetHeaderProps) {
  const trimmedName = characterName.trim()
  const displayName =
    trimmedName.length > 0 ? trimmedName : 'Unnamed Character'

  return (
    <header className="review-sheet-header" aria-label="Character sheet header">
      <div className="review-sheet-header__portrait">
        {speciesId !== null ? (
          <SpeciesIcon speciesId={speciesId} className="review-sheet-header__species-icon" />
        ) : (
          <span className="review-sheet-header__portrait-placeholder" aria-hidden="true">
            ?
          </span>
        )}
        {classId !== null ? (
          <span className="review-sheet-header__class-badge" title={className ?? undefined}>
            <ClassIcon classId={classId} />
          </span>
        ) : null}
      </div>

      <div className="review-sheet-header__identity">
        <h2 className="review-sheet-header__name">{displayName}</h2>
        {speciesName !== null ? (
          <p className="review-sheet-header__subtitle">{speciesName}</p>
        ) : null}
      </div>
    </header>
  )
}
