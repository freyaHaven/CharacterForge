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
    expect(image).toHaveAttribute('width', '192')
    expect(image).toHaveAttribute('height', '192')
    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders the generic SVG fallback when no icon is registered', () => {
    const { container } = render(<ClassIcon classId="srd-2024:unknown-class" />)

    const fallback = container.querySelector('svg')
    expect(container.querySelector('img')).toBeNull()
    expect(fallback).not.toBeNull()
    expect(fallback).toHaveAttribute('aria-hidden', 'true')
    expect(fallback).toHaveAttribute('width', '192')
    expect(fallback).toHaveAttribute('height', '192')
  })
})
