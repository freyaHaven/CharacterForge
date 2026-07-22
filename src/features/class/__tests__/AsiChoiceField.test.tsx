// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { FeatEligibilityContext } from '../../../domain/feat/eligibility'
import { AsiChoiceField } from '../AsiChoiceField'

const eligibilityContext: FeatEligibilityContext = {
  characterLevel: 4,
  abilityScores: {
    strength: 10,
    dexterity: 14,
    constitution: 20,
    intelligence: 12,
    wisdom: 13,
    charisma: 8,
  },
  hasSpellcasting: false,
  hasFightingStyle: true,
  takenFeatIds: [],
}

function createMockFeatCatalog() {
  return {
    listFeats: async () => [
      {
        id: 'srd-2024:alert',
        editionId: 'srd-2024' as const,
        name: 'Alert',
        category: 'origin' as const,
        summary: 'Always on the lookout.',
        description: 'Test feat',
        prerequisite: { kind: 'none' as const },
        benefits: [],
        repeatable: false,
        choices: [],
        source: {
          book: 'SRD',
          page: null,
          revision: '5.2.1',
          attribution: 'Test',
        },
      },
    ],
    getFeat: async (id: string) =>
      id === 'srd-2024:alert'
        ? {
            id: 'srd-2024:alert',
            editionId: 'srd-2024' as const,
            name: 'Alert',
            category: 'origin' as const,
            summary: 'Always on the lookout.',
            description: 'Test feat',
            prerequisite: { kind: 'none' as const },
            benefits: [],
            repeatable: false,
            choices: [],
            source: {
              book: 'SRD',
              page: null,
              revision: '5.2.1',
              attribution: 'Test',
            },
          }
        : null,
  }
}

function AsiHarness({
  initialValue = 'plus-2',
  scores = eligibilityContext.abilityScores,
}: {
  initialValue?: string
  scores?: typeof eligibilityContext.abilityScores | null
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <AsiChoiceField
      choiceId="ability-score-improvement-4"
      value={value}
      editionId="srd-2024"
      featCatalog={createMockFeatCatalog()}
      takenFeatIds={[]}
      eligibilityContext={eligibilityContext}
      currentAbilityScores={scores}
      onChange={(_choiceId, next) => {
        setValue(next)
      }}
    />
  )
}

describe('AsiChoiceField ability grid', () => {
  it('uses a stable ability card grid for +2 selection', async () => {
    const user = userEvent.setup()
    render(<AsiHarness />)

    expect(
      screen.getByRole('radiogroup', {
        name: /ability score to increase by 2/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('10 (+2)')).toBeInTheDocument()
    expect(screen.getByText('14 (+2)')).toBeInTheDocument()
    expect(
      screen.getByText(/ability scores can't be increased above 20/i),
    ).toBeInTheDocument()

    const constitution = screen.getByRole('radio', { name: /constitution/i })
    expect(constitution).toBeDisabled()
    expect(screen.getByText(/maximum reached/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /strength/i }))
    expect(screen.getByRole('radio', { name: /strength/i })).toBeChecked()
  })

  it('reuses the same grid as checkboxes for +1/+1 with a selection summary', async () => {
    const user = userEvent.setup()
    render(<AsiHarness initialValue="plus-1-1" />)

    expect(screen.getByText('Selected 0 / 2')).toBeInTheDocument()
    expect(screen.getByText('10 (+1)')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /strength/i }))
    expect(screen.getByText('Selected 1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /dexterity/i }))
    expect(screen.getByText('Selected 2 / 2')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /strength/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /dexterity/i })).toBeChecked()
  })

  it('keeps the ability grid visible but disabled in feat mode', async () => {
    const user = userEvent.setup()
    render(<AsiHarness initialValue="feat" />)

    const grid = screen.getByRole('radiogroup', { name: /^ability scores$/i })
    expect(grid).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('radio', { name: /strength/i })).toBeDisabled()
    expect(screen.getByLabelText(/show unavailable feats/i)).toBeInTheDocument()

    await user.click(
      screen.getByRole('radio', { name: /increase one ability score by 2/i }),
    )
    expect(
      screen.getByRole('radiogroup', {
        name: /ability score to increase by 2/i,
      }),
    ).toBeInTheDocument()
  })

  it('omits score lines when current scores are unknown', () => {
    render(<AsiHarness scores={null} />)

    expect(screen.getByText('Strength')).toBeInTheDocument()
    expect(screen.queryByText(/\(\+2\)/)).not.toBeInTheDocument()
    expect(screen.queryByText(/current:/i)).not.toBeInTheDocument()
  })
})
