import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { SpellDefinition } from '../../domain/spell/types'
import type { SpellSelectionEligibility } from '../../rules/spell/spellSelectionEligibility'
import { formatSpellLevelLabel } from './formatSpellLevelLabel'
import { normalizeSpellSchool } from './spellSchool'
import { SpellPreviewPopover } from './SpellPreviewPopover'
import { SpellSchoolIcon } from './SpellSchoolIcon'

export type SpellSelectionCardProps = {
  spell: SpellDefinition
  inputId: string
  selected: boolean
  /** Granted / always-prepared — not editable. */
  granted?: boolean
  disabled?: boolean
  invalid?: boolean
  /** Cross-source / within-source eligibility metadata. */
  eligibility?: SpellSelectionEligibility | null
  onToggle?: () => void
}

/**
 * Compact selectable spell card.
 * Spell details open from the info control (not card hover), matching HelpTooltip.
 */
export function SpellSelectionCard({
  spell,
  inputId,
  selected,
  granted = false,
  disabled = false,
  invalid = false,
  eligibility = null,
  onToggle,
}: SpellSelectionCardProps) {
  const infoButtonRef = useRef<HTMLButtonElement>(null)
  const previewAnchorRef = useRef<HTMLElement | null>(null)
  const [pinnedOpen, setPinnedOpen] = useState(false)
  const descriptionId = useId()
  const eligibilityId = useId()
  const schoolSlug = normalizeSpellSchool(spell.school)

  const isDiscouraged = eligibility?.recommendation === 'discouraged'
  const isBlocked = eligibility?.recommendation === 'blocked' && !selected
  const isDisabled = disabled || isBlocked
  const duplicateReason = eligibility?.duplicateReason ?? null

  const classNames = [
    'spell-selection-card',
    `spell-selection-card--school-${schoolSlug}`,
    selected ? 'spell-selection-card--selected' : null,
    granted ? 'spell-selection-card--granted' : null,
    isDisabled ? 'spell-selection-card--disabled' : null,
    invalid ? 'spell-selection-card--invalid' : null,
    isDiscouraged ? 'spell-selection-card--discouraged' : null,
    isBlocked ? 'spell-selection-card--blocked' : null,
  ]
    .filter(Boolean)
    .join(' ')

  const describedBy = [descriptionId, duplicateReason ? eligibilityId : null]
    .filter(Boolean)
    .join(' ')

  const meta = (
    <>
      <span className="spell-selection-card__name">{spell.name}</span>
      <span className="spell-selection-card__meta" id={descriptionId}>
        {formatSpellLevelLabel(spell.level)} • {spell.school}
      </span>
      {granted ? (
        <span className="spell-selection-card__badge">Always prepared</span>
      ) : null}
      {duplicateReason !== null && !granted ? (
        <>
          <span
            className={
              isBlocked
                ? 'spell-selection-card__badge spell-selection-card__badge--blocked'
                : 'spell-selection-card__badge spell-selection-card__badge--elsewhere'
            }
          >
            {isBlocked ? 'Already available' : 'Also available elsewhere'}
          </span>
          <span id={eligibilityId} className="visually-hidden">
            {duplicateReason}
          </span>
        </>
      ) : null}
    </>
  )

  return (
    <div className={classNames} data-school={schoolSlug}>
      <span className="spell-selection-card__school-strip" aria-hidden="true" />

      {granted ? (
        <div className="spell-selection-card__body">
          <SpellSchoolIcon school={spell.school} />
          <div className="spell-selection-card__copy">{meta}</div>
        </div>
      ) : (
        <label className="spell-selection-card__body" htmlFor={inputId}>
          <input
            id={inputId}
            className="spell-selection-card__checkbox"
            type="checkbox"
            checked={selected}
            disabled={isDisabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={() => {
              onToggle?.()
            }}
          />
          <SpellSchoolIcon school={spell.school} />
          <div className="spell-selection-card__copy">{meta}</div>
          <span
            className="spell-selection-card__select-mark"
            aria-hidden="true"
          >
            {selected ? '✓' : '+'}
          </span>
        </label>
      )}

      <button
        ref={infoButtonRef}
        type="button"
        className="spell-selection-card__info"
        aria-label={`${spell.name} details`}
        aria-expanded={pinnedOpen}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          previewAnchorRef.current = infoButtonRef.current
          setPinnedOpen((current) => !current)
        }}
      >
        ⓘ
      </button>

      <SpellPreviewPopover
        spell={spell}
        anchor={previewAnchorRef.current}
        open={pinnedOpen}
        dismissible
        onClose={() => {
          setPinnedOpen(false)
        }}
      />
    </div>
  )
}
