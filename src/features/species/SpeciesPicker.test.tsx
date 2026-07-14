// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createBundledSpeciesCatalog } from '../../adapters/bundledSpeciesCatalog'
import type { SpeciesSelection } from '../../domain/species/types'
import {
  createSpeciesSelectionDraft,
  type SpeciesSelectionDraft,
} from './speciesSelectionDraft'
import { SpeciesPicker } from './SpeciesPicker'

function SpeciesPickerHarness({
  initialCommitted = null,
  initialDraft = null,
}: {
  initialCommitted?: SpeciesSelection | null
  initialDraft?: SpeciesSelectionDraft | null
}) {
  const [committedSelection, setCommittedSelection] =
    useState<SpeciesSelection | null>(initialCommitted)
  const [draft, setDraft] = useState<SpeciesSelectionDraft | null>(initialDraft)
  const catalog = createBundledSpeciesCatalog()

  return (
    <SpeciesPicker
      editionId="srd-2024"
      committedSelection={committedSelection}
      draft={draft}
      catalog={catalog}
      onDraftChange={setDraft}
      onCommittedSelectionChange={setCommittedSelection}
    />
  )
}

describe('SpeciesPicker', () => {
  it('shows the ancestry selector on the first Dragonborn click', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      screen.getByRole('combobox', { name: /choose your draconic ancestor/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/selected: dragonborn/i),
    ).not.toBeInTheDocument()
  })

  it('does not show ancestry after focus alone when detail would have appeared early', async () => {
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    fireEvent.focus(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      screen.queryByRole('combobox', { name: /choose your draconic ancestor/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/complete required choices to confirm/i),
    ).not.toBeInTheDocument()
  })

  it('selects Dwarf immediately without a draft message', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      'Selected: Dwarf',
    )
    expect(
      screen.queryByText(/complete required choices to confirm/i),
    ).not.toBeInTheDocument()
  })

  it('keeps draft and committed in sync when ancestry is chosen', async () => {
    const user = userEvent.setup()
    render(
      <SpeciesPickerHarness
        initialDraft={createSpeciesSelectionDraft('srd-2024:dragonborn')}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.selectOptions(
      screen.getByRole('combobox', { name: /choose your draconic ancestor/i }),
      'red',
    )

    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      'Selected: Dragonborn',
    )
  })
})
