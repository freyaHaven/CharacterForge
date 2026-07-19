import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SpellDefinition } from '../../domain/spell/types'
import { computeSpellPreviewPosition } from './computeSpellPreviewPosition'
import { formatSpellLevelLabel } from './formatSpellLevelLabel'

export type SpellPreviewPopoverProps = {
  spell: SpellDefinition
  /** Anchor element the popover positions against. */
  anchor: HTMLElement | null
  open: boolean
  onClose?: () => void
  /** When true, show a dismiss control (touch / pinned open). */
  dismissible?: boolean
}

type StatIconProps = {
  className?: string
}

function CastingTimeIcon({ className }: StatIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="13"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
        d="M12 9.5v4l2.5 1.5M9 3.5h6"
      />
    </svg>
  )
}

function RangeIcon({ className }: StatIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"
      />
    </svg>
  )
}

function ComponentsIcon({ className }: StatIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        d="M8.5 11.5V8.25a1.75 1.75 0 0 1 3.5 0V11.5M12 11.5V7.5a1.75 1.75 0 0 1 3.5 0V11.5M15.5 11.5V9a1.75 1.75 0 0 1 3.5 0v5.75a4.75 4.75 0 0 1-4.75 4.75H13a5 5 0 0 1-5-5v-1.5a1.75 1.75 0 0 1 3.5 0"
      />
    </svg>
  )
}

function DurationIcon({ className }: StatIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        d="M7 3.5h10M7 20.5h10M8.5 3.5c0 3.2 2.2 5.2 3.5 6.5-1.3 1.3-3.5 3.3-3.5 6.5M15.5 3.5c0 3.2-2.2 5.2-3.5 6.5 1.3 1.3 3.5 3.3 3.5 6.5"
      />
      <path
        fill="currentColor"
        d="M10.25 12h3.5l-1.75 2.25L10.25 12Z"
      />
    </svg>
  )
}

/**
 * Shared spell preview for hover, keyboard focus, and touch info control.
 * Renders through a portal and keeps itself inside the viewport.
 */
export function SpellPreviewPopover({
  spell,
  anchor,
  open,
  onClose,
  dismissible = false,
}: SpellPreviewPopoverProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  )

  const updatePosition = useCallback(() => {
    const panel = panelRef.current
    if (!open || anchor === null || panel === null) {
      return
    }

    const panelRect = panel.getBoundingClientRect()
    setCoords(
      computeSpellPreviewPosition({
        anchorRect: anchor.getBoundingClientRect(),
        panelSize: { width: panelRect.width, height: panelRect.height },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      }),
    )
  }, [anchor, open])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }

    updatePosition()
  }, [open, updatePosition, spell.id])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleReposition = () => {
      updatePosition()
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open || !dismissible) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, dismissible, onClose])

  if (!open || typeof document === 'undefined') {
    return null
  }

  const stats = [
    {
      key: 'casting-time',
      label: 'Casting Time',
      value: spell.castingTime,
      icon: <CastingTimeIcon className="spell-preview-popover__stat-icon" />,
    },
    {
      key: 'range',
      label: 'Range',
      value: spell.range,
      icon: <RangeIcon className="spell-preview-popover__stat-icon" />,
    },
    {
      key: 'components',
      label: 'Components',
      value: spell.components,
      icon: <ComponentsIcon className="spell-preview-popover__stat-icon" />,
    },
    {
      key: 'duration',
      label: 'Duration',
      value: spell.duration,
      icon: <DurationIcon className="spell-preview-popover__stat-icon" />,
    },
  ] as const

  return createPortal(
    <div
      ref={panelRef}
      className="spell-preview-popover"
      role="tooltip"
      id={titleId}
      aria-hidden={!open}
      style={
        coords === null
          ? { visibility: 'hidden', top: 0, left: 0 }
          : { top: coords.top, left: coords.left }
      }
    >
      <div className="spell-preview-popover__header">
        <div className="spell-preview-popover__heading">
          <h3 className="spell-preview-popover__name">{spell.name}</h3>
          <p className="spell-preview-popover__meta">
            {formatSpellLevelLabel(spell.level)} • {spell.school}
          </p>
        </div>
        {dismissible ? (
          <button
            type="button"
            className="spell-preview-popover__close"
            aria-label={`Close ${spell.name} details`}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onClose?.()
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      <dl className="spell-preview-popover__stats">
        {stats.map((stat) => (
          <div key={stat.key} className="spell-preview-popover__stat">
            <dt className="spell-preview-popover__stat-label">
              {stat.icon}
              <span>{stat.label}</span>
            </dt>
            <dd className="spell-preview-popover__stat-value">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <p className="spell-preview-popover__description">{spell.description}</p>
    </div>,
    document.body,
  )
}
