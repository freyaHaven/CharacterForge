// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import type { FeatEligibility } from '../../../domain/feat/eligibility'
import type { FeatDefinition, FeatSelection } from '../../../domain/feat/types'
import { FeatPicker } from '../FeatPicker'
import type { FeatSelectionDraft } from '../featSelectionDraft'

function FeatPickerHarness({
  getEligibility,
  committedSelection = null,
}: {
  getEligibility?: (definition: FeatDefinition) => FeatEligibility
  committedSelection?: FeatSelection | null
} = {}) {
  const [draft, setDraft] = useState<FeatSelectionDraft | null>(null)
  const [committed, setCommitted] = useState<FeatSelection | null>(
    committedSelection,
  )

  return (
    <FeatPicker
      editionId="srd-2024"
      committedSelection={committed}
      draft={draft}
      catalog={createBundledFeatCatalog()}
      onDraftChange={setDraft}
      onCommittedSelectionChange={setCommitted}
      getEligibility={getEligibility}
      eligibilityContext={{
        characterLevel: 4,
        abilityScores: {
          strength: 10,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 12,
          charisma: 10,
        },
        hasSpellcasting: false,
        hasFightingStyle: false,
        takenFeatIds: [],
      }}
    />
  )
}

describe('FeatPicker', () => {
  it('shows a searchable catalogue and feat details with an explicit confirm action', async () => {
    const user = userEvent.setup()
    render(<FeatPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading feats/i)).not.toBeInTheDocument()
    })

    expect(screen.getByLabelText(/search feats/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Alert/i })).toBeInTheDocument()
    expect(
      screen.getByText(/select a feat from the catalogue/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Alert/i }))

    expect(
      screen.getByRole('heading', { name: 'Alert', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Initiative Proficiency')).toBeInTheDocument()
    expect(screen.getByText('Initiative Swap')).toBeInTheDocument()
    expect(screen.getAllByText(/Prerequisite/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /select this feat/i }))

    expect(screen.getByText(/selected feat:/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /select this feat/i }),
    ).not.toBeInTheDocument()
  })

  it('hides ineligible feats by default and never selects them', async () => {
    const user = userEvent.setup()
    render(
      <FeatPickerHarness
        getEligibility={(definition) =>
          definition.id === 'srd-2024:savage-attacker'
            ? {
                eligible: false,
                reason: 'Requires Strength 13 or higher',
              }
            : { eligible: true }
        }
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading feats/i)).not.toBeInTheDocument()
    })

    expect(
      screen.queryByRole('button', { name: /Savage Attacker/i }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(/show unavailable feats/i))

    const savageCard = screen.getByRole('button', { name: /Savage Attacker/i })
    expect(savageCard).toBeDisabled()
    expect(
      screen.getByText('Requires Strength 13 or higher'),
    ).toBeInTheDocument()

    await user.click(savageCard)

    expect(
      screen.getByText(/select a feat from the catalogue/i),
    ).toBeInTheDocument()
  })

  it('keeps a committed invalid feat visible with an explanation', async () => {
    render(
      <FeatPickerHarness
        committedSelection={{ featId: 'srd-2024:grappler', choices: {} }}
        getEligibility={(definition) =>
          definition.id === 'srd-2024:grappler'
            ? {
                eligible: false,
                reason: 'Requires character level 4+',
              }
            : { eligible: true }
        }
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading feats/i)).not.toBeInTheDocument()
    })

    expect(
      screen.getByRole('button', { name: /Grappler/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Invalid selection: Requires character level 4\+/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear feat selection/i })).toBeInTheDocument()
  })
})
