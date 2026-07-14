// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CharacterBasicsFields } from './CharacterBasicsFields'

describe('CharacterBasicsFields', () => {
  it('renders the saved name and edition', () => {
    render(
      <CharacterBasicsFields
        name="Aldric"
        editionId="srd-2024"
        onNameChange={vi.fn()}
        onEditionChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox', { name: /character name/i })).toHaveValue(
      'Aldric',
    )
    expect(screen.getByRole('combobox', { name: /rules edition/i })).toHaveValue(
      'srd-2024',
    )
  })

  it('calls onNameChange when the name is edited', async () => {
    const user = userEvent.setup()
    const onNameChange = vi.fn()

    render(
      <CharacterBasicsFields
        name=""
        editionId="srd-2024"
        onNameChange={onNameChange}
        onEditionChange={vi.fn()}
      />,
    )

    await user.type(screen.getByRole('textbox', { name: /character name/i }), 'B')

    expect(onNameChange).toHaveBeenCalled()
    expect(onNameChange).toHaveBeenLastCalledWith('B')
  })

  it('calls onEditionChange when the edition is selected', async () => {
    const user = userEvent.setup()
    const onEditionChange = vi.fn()

    render(
      <CharacterBasicsFields
        name=""
        editionId="srd-2024"
        onNameChange={vi.fn()}
        onEditionChange={onEditionChange}
      />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: /rules edition/i }),
      'srd-2014',
    )

    expect(onEditionChange).toHaveBeenCalledWith('srd-2014')
  })

  it('calls onBasicsTouched on name focus and edit', async () => {
    const user = userEvent.setup()
    const onBasicsTouched = vi.fn()

    render(
      <CharacterBasicsFields
        name="Aldric"
        editionId="srd-2024"
        onNameChange={vi.fn()}
        onEditionChange={vi.fn()}
        onBasicsTouched={onBasicsTouched}
      />,
    )

    const nameInput = screen.getByRole('textbox', { name: /character name/i })

    await user.click(nameInput)
    expect(onBasicsTouched).toHaveBeenCalledTimes(1)

    await user.type(nameInput, '!')
    expect(onBasicsTouched.mock.calls.length).toBeGreaterThan(1)
  })

  it('calls onBasicsTouched when the edition is changed', async () => {
    const user = userEvent.setup()
    const onBasicsTouched = vi.fn()

    render(
      <CharacterBasicsFields
        name="Aldric"
        editionId="srd-2024"
        onNameChange={vi.fn()}
        onEditionChange={vi.fn()}
        onBasicsTouched={onBasicsTouched}
      />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: /rules edition/i }),
      'srd-2014',
    )

    expect(onBasicsTouched).toHaveBeenCalled()
  })

  it('does not call onBasicsTouched when rendering loaded values', () => {
    const onBasicsTouched = vi.fn()

    render(
      <CharacterBasicsFields
        name="Aldric"
        editionId="srd-2024"
        onNameChange={vi.fn()}
        onEditionChange={vi.fn()}
        onBasicsTouched={onBasicsTouched}
      />,
    )

    expect(onBasicsTouched).not.toHaveBeenCalled()
  })
})
