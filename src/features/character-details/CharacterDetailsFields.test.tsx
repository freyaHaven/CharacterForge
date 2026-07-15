// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import { CharacterDetailsFields } from './CharacterDetailsFields'
import { BACKSTORY_NOTES_PLACEHOLDER } from './characterDetailsConstants'
import {
  CHARACTER_DETAILS_AGE_GUIDANCE_ID,
  CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID,
} from './characterDetailsA11y'

const dwarfGuidance = {
  age: 'Dwarves mature at the same rate as humans, but are considered young until they reach the age of 50.',
  height: 'Typical height: 120–150 cm',
}

const dragonbornGuidance = {
  age: 'Dragonborn reach adulthood by age 15 and live around 80 years.',
  height: 'Typical height: 170–195 cm',
}

describe('CharacterDetailsFields layout', () => {
  it('renders identity and personality columns with a full-width backstory section', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={null}
        onChange={() => {}}
      />,
    )

    expect(document.querySelector('.character-details-fields__columns')).not.toBeNull()
    expect(
      document.querySelector('.character-details-fields__column--identity'),
    ).not.toBeNull()
    expect(
      document.querySelector('.character-details-fields__column--personality'),
    ).not.toBeNull()
    expect(document.querySelector('.character-details-fields__backstory')).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Identity', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Personality', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Backstory & Notes', level: 3 }),
    ).toBeInTheDocument()
  })

  it('uses a table-like physical details grid and stacked colour fields', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={null}
        onChange={() => {}}
      />,
    )

    expect(document.querySelector('.character-details-fields__physical-grid')).not.toBeNull()
    expect(document.querySelector('.character-details-fields__physical-split')).toBeNull()
    expect(document.querySelector('.character-details-fields__physical-cell--age')).not.toBeNull()
    expect(document.querySelector('.character-details-fields__physical-cell--height')).not.toBeNull()
    expect(document.querySelector('.character-details-fields__physical-cell--weight')).not.toBeNull()
    expect(document.querySelector('.character-details-fields__colour-fields')).not.toBeNull()
    expect(document.querySelector('.character-details-fields__colour-grid')).toBeNull()
  })

  it('places age guidance beside age and height guidance beneath height in the physical grid', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={dwarfGuidance}
        onChange={() => {}}
      />,
    )

    const grid = document.querySelector('.character-details-fields__physical-grid')
    expect(grid?.querySelector('.character-details-fields__physical-cell--age-guidance')).not.toBeNull()
    expect(grid?.querySelector('.character-details-fields__physical-cell--height-guidance')).not.toBeNull()
    expect(grid?.querySelector('.character-details-fields__physical-cell--weight .character-details-fields__help')).toBeNull()
  })

  it('places Gender and Pronouns fieldsets side by side with the two-plus-one layout', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={null}
        onChange={() => {}}
      />,
    )

    const choices = document.querySelector('.character-details-fields__identity-choices')
    expect(choices).not.toBeNull()
    expect(choices?.querySelectorAll('.character-details-fields__choice-fieldset')).toHaveLength(2)

    const grids = choices?.querySelectorAll('.card-select-choice__grid--layout-two-plus-one')
    expect(grids).toHaveLength(2)

    expect(screen.getByRole('radio', { name: 'She/Her' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'He/Him' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'They/Them' })).toBeInTheDocument()

    const genderGrid = choices
      ?.querySelector('[name="character-details-gender"]')
      ?.closest('.card-select-choice__grid')
    const genderItems = genderGrid?.querySelectorAll('.card-select-choice__item')
    expect(genderItems?.[2]).toHaveClass('card-select-choice__item--span-full')
  })
})

describe('CharacterDetailsFields fields', () => {
  it('renders age, height, weight, colour, personality, and backstory fields', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={null}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Age' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Height' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Weight' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Eye Colour' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Hair Colour' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Skin Tone' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Personality Traits' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Ideals' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Bonds' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Flaws' })).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(BACKSTORY_NOTES_PLACEHOLDER),
    ).toBeInTheDocument()
  })

  it('supports gender and pronoun card selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={null}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('radio', { name: 'Non-Binary' }))
    await user.click(screen.getByRole('radio', { name: 'They/Them' }))

    expect(onChange).toHaveBeenCalledWith({ gender: 'non-binary' })
    expect(onChange).toHaveBeenCalledWith({ pronouns: 'they-them' })
  })
})

describe('CharacterDetailsFields species guidance accessibility', () => {
  it('gives Age and Height concise accessible names', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={dwarfGuidance}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Age' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Height' })).toBeInTheDocument()
  })

  it('associates species guidance through aria-describedby', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={dwarfGuidance}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveAttribute(
      'aria-describedby',
      CHARACTER_DETAILS_AGE_GUIDANCE_ID,
    )
    expect(screen.getByRole('textbox', { name: 'Height' })).toHaveAttribute(
      'aria-describedby',
      CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID,
    )
    expect(document.getElementById(CHARACTER_DETAILS_AGE_GUIDANCE_ID)).toHaveTextContent(
      dwarfGuidance.age,
    )
    expect(document.getElementById(CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID)).toHaveTextContent(
      dwarfGuidance.height,
    )
  })

  it('omits aria-describedby when species guidance is absent', () => {
    render(
      <CharacterDetailsFields
        details={createDefaultCharacterDetails()}
        speciesGuidance={null}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Age' })).not.toHaveAttribute(
      'aria-describedby',
    )
    expect(screen.getByRole('textbox', { name: 'Height' })).not.toHaveAttribute(
      'aria-describedby',
    )
  })

  it('updates described guidance when species changes without changing entered values', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const { rerender } = render(
      <CharacterDetailsFields
        details={{ ...createDefaultCharacterDetails(), age: '35', height: '140 cm' }}
        speciesGuidance={dwarfGuidance}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('35')

    rerender(
      <CharacterDetailsFields
        details={{ ...createDefaultCharacterDetails(), age: '35', height: '140 cm' }}
        speciesGuidance={dragonbornGuidance}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('35')
    expect(document.getElementById(CHARACTER_DETAILS_AGE_GUIDANCE_ID)).toHaveTextContent(
      dragonbornGuidance.age,
    )

    await user.type(screen.getByRole('textbox', { name: 'Age' }), '0')
    expect(onChange).toHaveBeenCalledWith({ age: '350' })
  })
})
