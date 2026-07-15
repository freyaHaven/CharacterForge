import { useRef } from 'react'
import { CHARACTER_FILE_ACCEPT } from '../adapters/characterFile'

export type LandingPageProps = {
  importError?: string | null
  onCreateNew: () => void
  onImportFile: (file: File) => void
}

export function LandingPage({
  importError = null,
  onCreateNew,
  onImportFile,
}: LandingPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="landing-page" aria-labelledby="landing-page-heading">
      <div className="landing-page__intro">
        <h2 id="landing-page-heading">Welcome to Character Forge</h2>
        <p className="landing-page__lead">
          Build a D&amp;D character step by step, or continue from a saved
          Character Forge file.
        </p>
      </div>

      <div className="landing-page__actions">
        <button
          type="button"
          className="landing-page__action landing-page__action--primary"
          onClick={onCreateNew}
        >
          Create New Character
        </button>
        <button
          type="button"
          className="landing-page__action"
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          Import Character
        </button>
        <input
          ref={fileInputRef}
          className="landing-page__file-input"
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
        <p className="landing-page__error" role="alert">
          {importError}
        </p>
      ) : null}
    </section>
  )
}
