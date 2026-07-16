import { useRef, useState } from 'react'
import { CHARACTER_FILE_ACCEPT } from '../adapters/characterFile'
import { DeleteCharacterDialog } from './DeleteCharacterDialog'
import type { RecentCharacterSummary } from './session/recentCharacterDisplay'
import {
  formatRecentCharacterBuildLine,
  formatRecentCharacterIdentityLine,
  formatRecentEditedLabel,
} from './session/recentCharacterDisplay'

export type HomePageProps = {
  importError?: string | null
  recentCharacters?: RecentCharacterSummary[]
  onCreateNew: () => void
  onImportFile: (file: File) => void
  onContinue: (characterId: string) => void
  onDelete: (characterId: string) => void
}

function DeleteCharacterIcon() {
  return (
    <svg
      className="home-page__recent-delete-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12a1 1 0 0 0 1-1V8H5v12a1 1 0 0 0 1 1z"
      />
    </svg>
  )
}

export function HomePage({
  importError = null,
  recentCharacters = [],
  onCreateNew,
  onImportFile,
  onContinue,
  onDelete,
}: HomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] =
    useState<RecentCharacterSummary | null>(null)

  return (
    <section className="home-page" aria-labelledby="home-page-heading">
      <div className="home-page__intro">
        <h2 id="home-page-heading">Welcome to Character Forge</h2>
        <p className="home-page__lead">
          Build a D&amp;D character step by step, import a saved file, or
          continue one of your recent characters.
        </p>
      </div>

      <div className="home-page__actions">
        <button
          type="button"
          className="home-page__action home-page__action--primary"
          onClick={onCreateNew}
        >
          Create New Character
        </button>
        <button
          type="button"
          className="home-page__action"
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          Import Character
        </button>
        <input
          ref={fileInputRef}
          className="home-page__file-input"
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
        <p className="home-page__error" role="alert">
          {importError}
        </p>
      ) : null}

      {recentCharacters.length > 0 ? (
        <section
          className="home-page__continue"
          aria-labelledby="home-page-continue-heading"
        >
          <h3 id="home-page-continue-heading" className="home-page__continue-heading">
            Continue
          </h3>
          <ul className="home-page__recent-list">
            {recentCharacters.map((summary) => {
              const identityLine = formatRecentCharacterIdentityLine(
                summary.name,
                summary.speciesName,
              )
              const buildLine = formatRecentCharacterBuildLine(summary.classes)
              const editedLabel = formatRecentEditedLabel(summary.updatedAt)
              const deleteName =
                summary.name.trim().length > 0 ? summary.name.trim() : 'Unnamed'

              return (
                <li key={summary.id}>
                  <div className="home-page__recent-card">
                    <button
                      type="button"
                      className="home-page__recent-open"
                      onClick={() => {
                        onContinue(summary.id)
                      }}
                    >
                      <span className="home-page__recent-identity">
                        {identityLine}
                      </span>
                      {buildLine !== null ? (
                        <span className="home-page__recent-build">
                          {buildLine}
                        </span>
                      ) : null}
                      <span className="home-page__recent-edited">
                        Edited {editedLabel}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="home-page__recent-delete"
                      aria-label={`Delete character ${deleteName}`}
                      onClick={() => {
                        setPendingDelete(summary)
                      }}
                    >
                      <DeleteCharacterIcon />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <DeleteCharacterDialog
        character={pendingDelete}
        onCancel={() => {
          setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete === null) {
            return
          }

          const characterId = pendingDelete.id
          setPendingDelete(null)
          onDelete(characterId)
        }}
      />
    </section>
  )
}
