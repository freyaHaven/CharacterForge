// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getClassIcon } from '../../../assets/iconRegistry'
import { ClassIcon } from '../ClassIcon'

describe('ClassIcon', () => {
  it('renders a compact icon for a registered class suffix', () => {
    const { container } = render(<ClassIcon classId="srd-2024:fighter" />)

    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    expect(image).toHaveAttribute('src', getClassIcon('srd-2024:fighter'))
    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders the generic SVG fallback when no icon is registered', () => {
    const { container } = render(<ClassIcon classId="srd-2024:unknown-class" />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
