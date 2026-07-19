import { describe, expect, it } from 'vitest'
import { computeSpellPreviewPosition } from '../computeSpellPreviewPosition'

describe('computeSpellPreviewPosition', () => {
  it('places the popover below the anchor when there is room', () => {
    expect(
      computeSpellPreviewPosition({
        anchorRect: { top: 40, bottom: 80, left: 100 },
        panelSize: { width: 200, height: 120 },
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ top: 88, left: 100 })
  })

  it('flips above the anchor near the bottom edge', () => {
    expect(
      computeSpellPreviewPosition({
        anchorRect: { top: 500, bottom: 540, left: 100 },
        panelSize: { width: 200, height: 120 },
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ top: 372, left: 100 })
  })

  it('clamps horizontally inside the viewport', () => {
    expect(
      computeSpellPreviewPosition({
        anchorRect: { top: 40, bottom: 80, left: 750 },
        panelSize: { width: 200, height: 120 },
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ top: 88, left: 592 })
  })
})
