import { within, type Screen } from '@testing-library/react'

const ABILITY_LABELS = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
] as const

const ABILITY_KEYS: Record<(typeof ABILITY_LABELS)[number], string> = {
  Strength: 'strength',
  Dexterity: 'dexterity',
  Constitution: 'constitution',
  Intelligence: 'intelligence',
  Wisdom: 'wisdom',
  Charisma: 'charisma',
}

export type AbilityLabel = (typeof ABILITY_LABELS)[number]

export function getCreationMethodSelect(screen: Screen): HTMLElement {
  return screen.getByRole('combobox', { name: /ability score method/i })
}

function getAbilityCard(screen: Screen, ability: AbilityLabel): HTMLElement {
  return screen.getByTestId(`ability-score-card-${ABILITY_KEYS[ability]}`)
}

export function getAbilityFieldSelect(
  screen: Screen,
  ability: AbilityLabel,
): HTMLElement {
  return within(getAbilityCard(screen, ability)).getByRole('combobox')
}

export function getAbilityFieldNumberInput(
  screen: Screen,
  ability: AbilityLabel,
): HTMLElement {
  return within(getAbilityCard(screen, ability)).getByRole('spinbutton')
}

export function getAbilityFieldModifier(
  screen: Screen,
  ability: AbilityLabel,
): HTMLElement {
  return within(getAbilityCard(screen, ability)).getByText('—', {
    selector: '.ability-score-card__modifier',
  })
}

export { ABILITY_LABELS }
