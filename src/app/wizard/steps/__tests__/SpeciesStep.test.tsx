// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createBundledSpeciesCatalog } from '../../../../adapters/bundledSpeciesCatalog'
import { SpeciesStep } from '../SpeciesStep'

describe('SpeciesStep', () => {
  it('renders the species picker inside the wizard step panel', async () => {
    render(
      <SpeciesStep
        editionId="srd-2024"
        committedSelection={null}
        draft={null}
        catalog={createBundledSpeciesCatalog()}
        onDraftChange={vi.fn()}
        onCommittedSelectionChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Species', level: 2 }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Dwarf' })).toBeInTheDocument()
  })
})
