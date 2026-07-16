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

  it('separates the catalogue panel from the detail panel in the layout', async () => {
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    const layout = document.querySelector('.species-picker__layout')
    expect(layout).not.toBeNull()
    expect(layout?.querySelector('.species-picker__catalog-panel')).not.toBeNull()
    expect(layout?.querySelector('.species-picker__detail-panel')).not.toBeNull()
    expect(
      layout?.querySelector(
        '.species-picker__detail, .species-picker__detail--placeholder',
      ),
    ).not.toBeNull()
  })

  it('filters catalogue cards by species name without changing selection', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))
    await user.type(screen.getByRole('searchbox', { name: /search species/i }), 'dragon')

    expect(screen.queryByRole('button', { name: 'Dwarf' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dragonborn' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dwarf' })).toBeInTheDocument()
    expect(
      screen.getByText(/selected species is hidden by the current search/i),
    ).toBeInTheDocument()
    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      'Selected: Dwarf',
    )
  })

  it('shows an empty catalogue message when search matches nothing', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.type(screen.getByRole('searchbox', { name: /search species/i }), 'elf')

    expect(screen.getByRole('status')).toHaveTextContent(/no species match.*elf/i)
    expect(screen.queryByRole('button', { name: 'Dwarf' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dragonborn' })).not.toBeInTheDocument()
  })

  it('restores selected card styling after clearing search', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))
    const search = screen.getByRole('searchbox', { name: /search species/i })
    await user.type(search, 'dragon')
    await user.clear(search)

    const selectedCard = screen.getByRole('button', { name: 'Dwarf' })
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
    expect(
      selectedCard.querySelector('.species-picker__card-badge[aria-hidden="true"]'),
    ).not.toBeNull()
  })

  it('renders metadata row and individual trait cards in the detail panel', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    const detail = document.querySelector('.species-picker__detail')
    expect(detail).not.toBeNull()
    expect(detail?.querySelector('.species-picker__identity-row')).not.toBeNull()
    expect(detail?.querySelector('.species-picker__detail-icon')).not.toBeNull()
    expect(detail?.querySelector('.species-picker__metadata')).not.toBeNull()
    expect(detail?.querySelectorAll('.species-picker__metadata-item')).toHaveLength(
      2,
    )
    expect(detail?.querySelectorAll('.species-picker__trait-icon')).toHaveLength(3)
    expect(detail?.querySelectorAll('.species-picker__trait-card')).toHaveLength(3)
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('30 feet')).toBeInTheDocument()
  })

  it('shows a decorative check badge only on the selected catalogue card', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    expect(document.querySelector('.species-picker__card-badge')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    const selectedCard = screen.getByRole('button', { name: 'Dwarf' })
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
    expect(
      selectedCard.querySelector('.species-picker__card-badge[aria-hidden="true"]'),
    ).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'Dragonborn' }).querySelector(
        '.species-picker__card-badge',
      ),
    ).toBeNull()
  })
})
