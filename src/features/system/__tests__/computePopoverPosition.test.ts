import { describe, expect, it } from 'vitest'
import { computePopoverPosition } from '../computePopoverPosition'

describe('computePopoverPosition', () => {
  it('places the popover below the anchor when there is room', () => {
    expect(
      computePopoverPosition({
        anchorRect: { top: 40, bottom: 80, left: 100 },
        panelSize: { width: 200, height: 120 },
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ top: 88, left: 100 })
  })

  it('flips above the anchor near the bottom edge', () => {
    expect(
      computePopoverPosition({
        anchorRect: { top: 500, bottom: 540, left: 100 },
        panelSize: { width: 200, height: 120 },
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ top: 372, left: 100 })
  })

  it('clamps horizontally inside the viewport', () => {
    expect(
      computePopoverPosition({
        anchorRect: { top: 40, bottom: 80, left: 750 },
        panelSize: { width: 200, height: 120 },
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ top: 88, left: 592 })
  })
})
