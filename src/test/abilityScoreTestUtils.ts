import { within, type Screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import type { CharacterCreationMethod } from '../domain/types'
import { CREATION_METHOD_OPTIONS } from '../features/creation-method/creationMethodOptions'

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

function getCreationMethodLabel(method: CharacterCreationMethod): string {
  const option = CREATION_METHOD_OPTIONS.find((entry) => entry.id === method)
  return option?.label ?? method
}

export function getCreationMethodRadio(
  screen: Screen,
  method: CharacterCreationMethod,
): HTMLElement {
  return screen.getByRole('radio', {
    name: new RegExp(`^${getCreationMethodLabel(method)}`, 'i'),
  })
}

export async function selectCreationMethod(
  user: UserEvent,
  screen: Screen,
  method: CharacterCreationMethod,
): Promise<void> {
  await user.click(getCreationMethodRadio(screen, method))
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
