type EditionChangeDialogProps = {
  open: boolean
  clearsSpecies: boolean
  clearsClass: boolean
  onConfirm: () => void
  onCancel: () => void
}

function buildEditionChangeMessage(
  clearsSpecies: boolean,
  clearsClass: boolean,
): string {
  if (clearsSpecies && clearsClass) {
    return 'Changing edition will clear your species and class selections because those definitions belong to the previous edition. Continue?'
  }

  if (clearsSpecies) {
    return 'Changing edition will clear your species selection because the selected species definition belongs to the previous edition. Continue?'
  }

  if (clearsClass) {
    return 'Changing edition will clear your class selection because the selected class definition belongs to the previous edition. Continue?'
  }

  return 'Changing edition will update the rules used for this character. Continue?'
}

export function EditionChangeDialog({
  open,
  clearsSpecies,
  clearsClass,
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
          {buildEditionChangeMessage(clearsSpecies, clearsClass)}
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
