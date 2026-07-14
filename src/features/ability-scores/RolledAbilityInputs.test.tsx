// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RolledAbilityInputs } from './RolledAbilityInputs'
import { ROLLED_UNASSIGNED_LABEL } from './RolledAbilityInputs'
import { createRolledDraftFromManualTotals } from './rolledDraft'
import { getAbilityFieldSelect } from '../../test/abilityScoreTestUtils'

describe('RolledAbilityInputs', () => {
  const manualDraft = createRolledDraftFromManualTotals([15, 15, 13, 12, 10, 8])
  if ('error' in manualDraft) {
    throw new Error('Expected manual draft')
  }

  it('includes an em dash option in each ability dropdown', () => {
    render(
      <RolledAbilityInputs
        pool={manualDraft.pool}
        assignments={manualDraft.assignments}
        onAssignmentChange={vi.fn()}
      />,
    )

    for (const ability of [
      'Strength',
      'Dexterity',
      'Constitution',
      'Intelligence',
      'Wisdom',
      'Charisma',
    ] as const) {
      const select = getAbilityFieldSelect(screen, ability)
      expect(
        within(select).getByRole('option', { name: ROLLED_UNASSIGNED_LABEL }),
      ).toBeInTheDocument()
    }
  })

  it('calls onAssignmentChange with the selected roll id', async () => {
    const user = userEvent.setup()
    const onAssignmentChange = vi.fn()

    render(
      <RolledAbilityInputs
        pool={manualDraft.pool}
        assignments={manualDraft.assignments}
        onAssignmentChange={onAssignmentChange}
      />,
    )

    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), 'rolled-0')

    expect(onAssignmentChange).toHaveBeenCalledWith('strength', 'rolled-0')
  })

  it('disambiguates duplicate totals in the dropdown labels', () => {
    render(
      <RolledAbilityInputs
        pool={manualDraft.pool}
        assignments={manualDraft.assignments}
        onAssignmentChange={vi.fn()}
      />,
    )

    const strengthSelect = getAbilityFieldSelect(screen, 'Strength')
    const options = within(strengthSelect).getAllByRole('option')
    const labels = options.map((option) => option.textContent)

    expect(labels).toContain('Manual result: 15')
    expect(labels).toContain('Manual result: 15 (result 2)')
  })
})
