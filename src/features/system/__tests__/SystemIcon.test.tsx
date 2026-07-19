// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getSystemIcon } from '../../../assets/iconRegistry'
import { SystemIcon } from '../SystemIcon'

describe('SystemIcon', () => {
  it('renders the matching 50px system asset', () => {
    const { container } = render(<SystemIcon name="dexterity" size={50} />)
    const image = container.querySelector('img')

    expect(image).not.toBeNull()
    expect(image).toHaveAttribute('src', getSystemIcon('dexterity', 50))
    expect(image).toHaveAttribute('width', '50')
    expect(image).toHaveAttribute('height', '50')
    expect(image).toHaveAttribute('aria-hidden', 'true')
  })

  it('returns nothing for an unknown system icon name', () => {
    const { container } = render(<SystemIcon name="missing-icon" size={50} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders the warning icon for incomplete status', () => {
    const { container } = render(
      <SystemIcon name="warning" size={50} alt="Incomplete" />,
    )
    const image = container.querySelector('img')

    expect(image).not.toBeNull()
    expect(image).toHaveAttribute('src', getSystemIcon('warning', 50))
    expect(image).toHaveAttribute('alt', 'Incomplete')
  })
})
