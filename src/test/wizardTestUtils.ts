import type { UserEvent } from '@testing-library/user-event'
import type { Screen } from '@testing-library/react'

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
  await goToWizardStep(user, screen, 'Ability Scores')
}
