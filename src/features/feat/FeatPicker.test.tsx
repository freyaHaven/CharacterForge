// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
import type { FeatEligibility } from '../../domain/feat/eligibility'
import type { FeatDefinition, FeatSelection } from '../../domain/feat/types'
import { FeatPicker } from './FeatPicker'
import type { FeatSelectionDraft } from './featSelectionDraft'

function FeatPickerHarness({
  getEligibility,
}: {
  getEligibility?: (definition: FeatDefinition) => FeatEligibility
} = {}) {
  const [draft, setDraft] = useState<FeatSelectionDraft | null>(null)
  const [committedSelection, setCommittedSelection] =
    useState<FeatSelection | null>(null)

  return (
    <FeatPicker
      editionId="srd-2024"
      committedSelection={committedSelection}
      draft={draft}
      catalog={createBundledFeatCatalog()}
      onDraftChange={setDraft}
      onCommittedSelectionChange={setCommittedSelection}
      getEligibility={getEligibility}
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

  it('keeps ineligible feats visible and shows the failure reason on the card', async () => {
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
})
