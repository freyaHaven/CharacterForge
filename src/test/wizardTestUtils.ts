import type { UserEvent } from '@testing-library/user-event'
import type { Screen } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { expect } from 'vitest'

export function getWizardStepButton(screen: Screen, stepLabel: string) {
  return screen.getByRole('button', {
    name: new RegExp(`^${stepLabel},`, 'i'),
  })
}

export async function goToWizardStep(
  user: UserEvent,
  screen: Screen,
  stepLabel: string,
) {
  await user.click(getWizardStepButton(screen, stepLabel))
}

export async function goToAbilityScoresStep(
  user: UserEvent,
  screen: Screen,
) {
  await goToWizardStep(user, screen, 'Abilities')
}

export async function goToSpeciesStep(user: UserEvent, screen: Screen) {
  await goToWizardStep(user, screen, 'Species')
}

export async function goToClassStep(user: UserEvent, screen: Screen) {
  await goToWizardStep(user, screen, 'Class')
}

export async function waitForClassLoaded(screen: Screen) {
  await waitFor(() => {
    expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
  })
}

export async function completeFighterSelection(
  user: UserEvent,
  screen: Screen,
  {
    fightingStyle = /Defense/i,
    skills = ['Athletics', 'Perception'] as const,
    weapons = ['Longsword', 'Shortbow', 'Battleaxe'] as const,
  }: {
    fightingStyle?: RegExp | string
    skills?: readonly [string, string]
    weapons?: readonly [string, string, string]
  } = {},
) {
  await goToClassStep(user, screen)
  await waitForClassLoaded(screen)

  await user.click(
    screen.getByRole('radio', {
      name: /single class/i,
    }),
  )

  await user.click(screen.getByRole('button', { name: 'Fighter' }))
  await user.click(screen.getByRole('button', { name: /Fighting Style/i }))
  await user.click(screen.getByRole('radio', { name: fightingStyle }))
  await user.click(screen.getByRole('button', { name: /Core Fighter Traits/i }))
  await user.click(
    screen.getByRole('checkbox', { name: new RegExp(`^${skills[0]}\\b`) }),
  )
  await user.click(
    screen.getByRole('checkbox', { name: new RegExp(`^${skills[1]}\\b`) }),
  )
  await user.click(screen.getByRole('button', { name: /^Weapon Mastery(?! \(Additional\))/i }))
  await user.click(
    screen.getByRole('checkbox', { name: new RegExp(`^${weapons[0]}\\b`) }),
  )
  await user.click(
    screen.getByRole('checkbox', { name: new RegExp(`^${weapons[1]}\\b`) }),
  )
  await user.click(
    screen.getByRole('checkbox', { name: new RegExp(`^${weapons[2]}\\b`) }),
  )
}
