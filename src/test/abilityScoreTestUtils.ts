import { within, type Screen } from '@testing-library/react'

const ABILITY_LABELS = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
] as const

export type AbilityLabel = (typeof ABILITY_LABELS)[number]

export function getCreationMethodSelect(screen: Screen): HTMLElement {
  return screen.getByRole('combobox', { name: /ability score method/i })
}

export function getAbilityFieldSelect(
  screen: Screen,
  ability: AbilityLabel,
): HTMLElement {
  const label = screen.getByText(ability, { selector: 'span' }).closest('label')

  if (label === null) {
    throw new Error(`Could not find ability field for ${ability}`)
  }

  return within(label).getByRole('combobox')
}

export function getAbilityFieldNumberInput(
  screen: Screen,
  ability: AbilityLabel,
): HTMLElement {
  const label = screen.getByText(ability, { selector: 'span' }).closest('label')

  if (label === null) {
    throw new Error(`Could not find ability field for ${ability}`)
  }

  return within(label).getByRole('spinbutton')
}

export function getAbilityFieldModifier(
  screen: Screen,
  ability: AbilityLabel,
): HTMLElement {
  const label = screen.getByText(ability, { selector: 'span' }).closest('label')

  if (label === null) {
    throw new Error(`Could not find ability field for ${ability}`)
  }

  return within(label).getByText('—', { selector: '.modifier' })
}

export { ABILITY_LABELS }
