export type WizardEditorActionsProps = {
  canSave: boolean
  saveMessage: string | null
  saveBlockedMessage: string
  onSaveDraft: () => void
  onExportCharacter: () => void
}

export function WizardEditorActions({
  canSave,
  saveMessage,
  saveBlockedMessage,
  onSaveDraft,
  onExportCharacter,
}: WizardEditorActionsProps) {
  return (
    <div className="wizard-editor-actions">
      <div className="wizard-editor-actions__buttons">
        <button
          type="button"
          className="wizard-editor-actions__button wizard-editor-actions__button--primary"
          disabled={!canSave}
          onClick={onSaveDraft}
        >
          Save draft
        </button>
        <button
          type="button"
          className="wizard-editor-actions__button"
          onClick={onExportCharacter}
        >
          Export Character
        </button>
      </div>
      {saveMessage !== null ? (
        <p className="wizard-editor-actions__status">{saveMessage}</p>
      ) : null}
      {!canSave ? (
        <p className="wizard-editor-actions__status">{saveBlockedMessage}</p>
      ) : null}
    </div>
  )
}
