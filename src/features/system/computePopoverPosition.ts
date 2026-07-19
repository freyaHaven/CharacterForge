export type PopoverCoords = {
  top: number
  left: number
}

const VIEWPORT_PADDING = 8
const GAP = 8

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Compute fixed popover coordinates that stay inside the viewport.
 * Prefers below the anchor; flips above when there is not enough room.
 */
export function computePopoverPosition(input: {
  anchorRect: Pick<DOMRect, 'top' | 'bottom' | 'left'>
  panelSize: { width: number; height: number }
  viewport: { width: number; height: number }
}): PopoverCoords {
  const { anchorRect, panelSize, viewport } = input

  let top = anchorRect.bottom + GAP
  let left = anchorRect.left

  if (top + panelSize.height > viewport.height - VIEWPORT_PADDING) {
    top = anchorRect.top - panelSize.height - GAP
  }

  top = clamp(
    top,
    VIEWPORT_PADDING,
    Math.max(
      VIEWPORT_PADDING,
      viewport.height - panelSize.height - VIEWPORT_PADDING,
    ),
  )
  left = clamp(
    left,
    VIEWPORT_PADDING,
    Math.max(
      VIEWPORT_PADDING,
      viewport.width - panelSize.width - VIEWPORT_PADDING,
    ),
  )

  return { top, left }
}
