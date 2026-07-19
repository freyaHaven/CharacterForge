import { useCallback, useId, useRef, useState } from 'react'
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
 * Compact selectable spell card with shared preview popover (hover, focus, touch).
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
  const cardRef = useRef<HTMLDivElement>(null)
  const infoButtonRef = useRef<HTMLButtonElement>(null)
  const previewAnchorRef = useRef<HTMLElement | null>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [pinnedOpen, setPinnedOpen] = useState(false)
  const blurTimerRef = useRef<number | null>(null)
  const descriptionId = useId()
  const eligibilityId = useId()
  const schoolSlug = normalizeSpellSchool(spell.school)

  const previewOpen = hoverOpen || focusOpen || pinnedOpen
  const isDiscouraged = eligibility?.recommendation === 'discouraged'
  const isBlocked = eligibility?.recommendation === 'blocked' && !selected
  const isDisabled = disabled || isBlocked
  const duplicateReason = eligibility?.duplicateReason ?? null

  const clearBlurTimer = useCallback(() => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }, [])

  const closeTransientPreview = useCallback(() => {
    setHoverOpen(false)
    setFocusOpen(false)
  }, [])

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
        <span
          className={
            isBlocked
              ? 'spell-selection-card__badge spell-selection-card__badge--blocked'
              : 'spell-selection-card__badge spell-selection-card__badge--elsewhere'
          }
          id={eligibilityId}
        >
          {isBlocked ? 'Already available' : 'Also available elsewhere'}
        </span>
      ) : null}
    </>
  )

  return (
    <div
      ref={cardRef}
      className={classNames}
      data-school={schoolSlug}
      title={duplicateReason ?? undefined}
      onMouseEnter={() => {
        if (pinnedOpen) {
          return
        }
        previewAnchorRef.current = cardRef.current
        setHoverOpen(true)
      }}
      onMouseLeave={() => {
        setHoverOpen(false)
      }}
    >
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
            onFocus={() => {
              clearBlurTimer()
              if (!pinnedOpen) {
                previewAnchorRef.current = cardRef.current
                setFocusOpen(true)
              }
            }}
            onBlur={() => {
              clearBlurTimer()
              blurTimerRef.current = window.setTimeout(() => {
                const active = document.activeElement
                if (
                  active === infoButtonRef.current ||
                  cardRef.current?.contains(active)
                ) {
                  return
                }
                setFocusOpen(false)
              }, 0)
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
          closeTransientPreview()
        }}
        onFocus={() => {
          clearBlurTimer()
        }}
        onBlur={() => {
          clearBlurTimer()
          blurTimerRef.current = window.setTimeout(() => {
            const active = document.activeElement
            if (cardRef.current?.contains(active)) {
              return
            }
            setFocusOpen(false)
          }, 0)
        }}
      >
        ⓘ
      </button>

      <SpellPreviewPopover
        spell={spell}
        anchor={previewAnchorRef.current}
        open={previewOpen}
        dismissible={pinnedOpen}
        onClose={() => {
          setPinnedOpen(false)
          closeTransientPreview()
        }}
      />
    </div>
  )
}
