import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { computePopoverPosition } from './computePopoverPosition'

export type HelpTooltipProps = {
  /**
   * Accessible name for the help control.
   * Prefer a specific phrase, e.g. "About prepared spells".
   */
  label: string
  /** Optional short heading shown inside the panel. */
  title?: string
  /** Concise beginner-friendly explanation. */
  children: ReactNode
  className?: string
}

/**
 * Standard contextual help control for Character Forge.
 *
 * Use beside labels and headings to explain D&D terminology without
 * cluttering the page with always-visible copy. Opens on click/tap or
 * keyboard focus — not on hover — so it stays intentional.
 */
export function HelpTooltip({
  label,
  title,
  children,
  className,
}: HelpTooltipProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<number | null>(null)
  const tooltipId = useId()
  const [focusOpen, setFocusOpen] = useState(false)
  const [pinnedOpen, setPinnedOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  )

  const open = focusOpen || pinnedOpen

  const clearBlurTimer = useCallback(() => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }, [])

  const closeAll = useCallback(() => {
    setPinnedOpen(false)
    setFocusOpen(false)
  }, [])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!open || trigger === null || panel === null) {
      return
    }

    const panelRect = panel.getBoundingClientRect()
    setCoords(
      computePopoverPosition({
        anchorRect: trigger.getBoundingClientRect(),
        panelSize: { width: panelRect.width, height: panelRect.height },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      }),
    )
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }

    updatePosition()
  }, [open, updatePosition, children, title])

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
    if (!pinnedOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      closeAll()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAll()
        triggerRef.current?.focus()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pinnedOpen, closeAll])

  useEffect(() => {
    return () => {
      clearBlurTimer()
    }
  }, [clearBlurTimer])

  const rootClassName = ['help-tooltip', className].filter(Boolean).join(' ')

  return (
    <span className={rootClassName}>
      <button
        ref={triggerRef}
        type="button"
        className="help-tooltip__trigger"
        aria-label={label}
        aria-expanded={pinnedOpen || focusOpen}
        aria-describedby={open ? tooltipId : undefined}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setPinnedOpen((current) => !current)
          setFocusOpen(false)
        }}
        onFocus={() => {
          clearBlurTimer()
          if (!pinnedOpen) {
            setFocusOpen(true)
          }
        }}
        onBlur={() => {
          clearBlurTimer()
          blurTimerRef.current = window.setTimeout(() => {
            const active = document.activeElement
            if (
              triggerRef.current === active ||
              panelRef.current?.contains(active)
            ) {
              return
            }
            setFocusOpen(false)
          }, 0)
        }}
      >
        <span className="help-tooltip__glyph" aria-hidden="true">
          ?
        </span>
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={tooltipId}
              className="help-tooltip__panel"
              role="tooltip"
              style={
                coords === null
                  ? { visibility: 'hidden', top: 0, left: 0 }
                  : { top: coords.top, left: coords.left }
              }
            >
              {title !== undefined && title.length > 0 ? (
                <p className="help-tooltip__title">{title}</p>
              ) : null}
              <div className="help-tooltip__body">{children}</div>
              {pinnedOpen ? (
                <button
                  type="button"
                  className="help-tooltip__close"
                  aria-label={`Close ${label}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    closeAll()
                    triggerRef.current?.focus()
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </span>
  )
}
