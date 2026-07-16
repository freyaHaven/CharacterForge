import type { RecentCharacterSummary } from './session/recentCharacterDisplay'
import {
  formatRecentCharacterBuildLine,
  formatRecentCharacterIdentityLine,
} from './session/recentCharacterDisplay'

export type DeleteCharacterDialogProps = {
  character: RecentCharacterSummary | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteCharacterDialog({
  character,
  onConfirm,
  onCancel,
}: DeleteCharacterDialogProps) {
  if (character === null) {
    return null
  }

  const identityLine = formatRecentCharacterIdentityLine(
    character.name,
    character.speciesName,
  )
  const buildLine = formatRecentCharacterBuildLine(character.classes)

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-character-dialog-title"
        aria-describedby="delete-character-dialog-description"
      >
        <h2 id="delete-character-dialog-title">Delete Character?</h2>
        <div id="delete-character-dialog-description">
          <p className="dialog__character-identity">{identityLine}</p>
          {buildLine !== null ? (
            <p className="dialog__character-build">{buildLine}</p>
          ) : null}
          <p>This action cannot be undone.</p>
        </div>
        <div className="dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="dialog__action--danger"
            onClick={onConfirm}
          >
            Delete Character
          </button>
        </div>
      </div>
    </div>
  )
}
