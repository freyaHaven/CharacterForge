// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClassIcon } from './ClassIcon'
import { getClassIconAsset } from './classIconRegistry'

describe('ClassIcon', () => {
  it('renders a PNG for a registered class suffix', () => {
    const { container } = render(<ClassIcon classId="srd-2024:fighter" />)

    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    expect(image).toHaveAttribute('src', getClassIconAsset('srd-2024:fighter'))
    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders the generic SVG fallback when no PNG is registered', () => {
    const { container } = render(<ClassIcon classId="srd-2024:wizard" />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
