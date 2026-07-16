import { useRef } from 'react'
import { CHARACTER_FILE_ACCEPT } from '../../adapters/characterFile'

export type WizardEditorActionsProps = {
  importError?: string | null
  onImportFile: (file: File) => void
  onExportCharacter: () => void
}

export function WizardEditorActions({
  importError = null,
  onImportFile,
  onExportCharacter,
}: WizardEditorActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="wizard-editor-actions">
      <div className="wizard-editor-actions__buttons">
        <button
          type="button"
          className="wizard-editor-actions__button"
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          Import Character
        </button>
        <button
          type="button"
          className="wizard-editor-actions__button wizard-editor-actions__button--primary"
          onClick={onExportCharacter}
        >
          Export Character
        </button>
        <input
          ref={fileInputRef}
          className="wizard-editor-actions__file-input"
          type="file"
          accept={CHARACTER_FILE_ACCEPT}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file !== undefined) {
              onImportFile(file)
            }

            event.target.value = ''
          }}
        />
      </div>
      {importError !== null ? (
        <p className="wizard-editor-actions__status" role="alert">
          {importError}
        </p>
      ) : null}
    </div>
  )
}
