// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StandardArrayAbilityInputs } from '../StandardArrayAbilityInputs'
import {
  ABILITY_LABELS,
  getAbilityFieldModifier,
  getAbilityFieldSelect,
} from '../../../testing/abilityScoreTestUtils'
import {
  createEmptyStandardArrayDraft,
  defaultStandardArrayDraft,
  type StandardArrayDraftScores,
} from '../standardArrayDraft'
import { STANDARD_ARRAY_UNASSIGNED_LABEL } from '../StandardArrayAbilityInputs'

describe('StandardArrayAbilityInputs', () => {
  it('includes an em dash option in each ability dropdown', () => {
    render(
      <StandardArrayAbilityInputs
        draft={createEmptyStandardArrayDraft()}
        onDraftChange={vi.fn()}
      />,
    )

    for (const ability of ABILITY_LABELS) {
      const select = getAbilityFieldSelect(screen, ability)
      expect(
        within(select).getByRole('option', { name: STANDARD_ARRAY_UNASSIGNED_LABEL }),
      ).toBeInTheDocument()
    }
  })

  it('clears the ability in the draft when the em dash option is selected', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()

    render(
      <StandardArrayAbilityInputs
        draft={defaultStandardArrayDraft()}
        onDraftChange={onDraftChange}
      />,
    )

    await user.selectOptions(
      getAbilityFieldSelect(screen, 'Strength'),
      STANDARD_ARRAY_UNASSIGNED_LABEL,
    )

    expect(onDraftChange).toHaveBeenCalledWith('strength', null)
  })

  it('disables values already selected by another ability', () => {
    render(
      <StandardArrayAbilityInputs
        draft={defaultStandardArrayDraft()}
        onDraftChange={vi.fn()}
      />,
    )

    const dexteritySelect = getAbilityFieldSelect(screen, 'Dexterity')
    expect(within(dexteritySelect).getByRole('option', { name: '15' })).toBeDisabled()
  })

  it('keeps the current ability own selected value enabled', () => {
    render(
      <StandardArrayAbilityInputs
        draft={defaultStandardArrayDraft()}
        onDraftChange={vi.fn()}
      />,
    )

    const strengthSelect = getAbilityFieldSelect(screen, 'Strength')
    expect(within(strengthSelect).getByRole('option', { name: '15' })).toBeEnabled()
  })

  it('displays TOTAL -- while an ability is unassigned', () => {
    const draft: StandardArrayDraftScores = {
      ...defaultStandardArrayDraft(),
      strength: null,
    }

    render(
      <StandardArrayAbilityInputs draft={draft} onDraftChange={vi.fn()} />,
    )

    expect(getAbilityFieldModifier(screen, 'Strength')).toHaveTextContent(
      'TOTAL --',
    )
  })
})
