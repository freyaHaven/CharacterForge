type EditionChangeDialogProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function EditionChangeDialog({
  open,
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
          Changing edition will clear your species selection because the selected
          species definition belongs to the previous edition. Continue?
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
