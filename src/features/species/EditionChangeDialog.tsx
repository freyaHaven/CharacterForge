type EditionChangeDialogProps = {
  open: boolean
  clearsSpecies: boolean
  clearsClass: boolean
  clearsBackground: boolean
  onConfirm: () => void
  onCancel: () => void
}

function buildEditionChangeMessage(
  clearsSpecies: boolean,
  clearsClass: boolean,
  clearsBackground: boolean,
): string {
  const clearedParts: string[] = []

  if (clearsSpecies) {
    clearedParts.push('species')
  }

  if (clearsClass) {
    clearedParts.push('class')
  }

  if (clearsBackground) {
    clearedParts.push('background')
  }

  if (clearedParts.length === 0) {
    return 'Changing edition will update the rules used for this character. Continue?'
  }

  const selectionList =
    clearedParts.length === 1
      ? `${clearedParts[0]} selection`
      : `${clearedParts.slice(0, -1).join(', ')} and ${clearedParts.at(-1)} selections`

  return `Changing edition will clear your ${selectionList} because those definitions belong to the previous edition. Continue?`
}

export function EditionChangeDialog({
  open,
  clearsSpecies,
  clearsClass,
  clearsBackground,
  onConfirm,
  onCancel,
}: EditionChangeDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="edition-change-dialog-title"
        aria-describedby="edition-change-dialog-description"
      >
        <h2 id="edition-change-dialog-title">Change rules edition?</h2>
        <p id="edition-change-dialog-description">
          {buildEditionChangeMessage(
            clearsSpecies,
            clearsClass,
            clearsBackground,
          )}
        </p>
        <div className="dialog__actions">
          <button type="button" onClick={onConfirm}>
            Continue
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
