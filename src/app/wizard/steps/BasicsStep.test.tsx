// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BasicsStep } from './BasicsStep'

describe('BasicsStep', () => {
  it('wires CharacterBasicsFields with the provided handlers', async () => {
    const user = userEvent.setup()
    const onNameChange = vi.fn()
    const onBasicsTouched = vi.fn()

    render(
      <BasicsStep
        name=""
        editionId="srd-2024"
        onNameChange={onNameChange}
        onEditionChange={vi.fn()}
        onBasicsTouched={onBasicsTouched}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Basics', level: 2 }),
    ).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /character name/i }), 'Z')

    expect(onBasicsTouched).toHaveBeenCalled()
    expect(onNameChange).toHaveBeenCalled()
  })
})
