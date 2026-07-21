// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import type { SpeciesSelection } from '../../../domain/species/types'
import {
  createSpeciesSelectionDraft,
  type SpeciesSelectionDraft,
} from '../speciesSelectionDraft'
import { SpeciesPicker } from '../SpeciesPicker'
import {
  COMPLETE_DWARF_SELECTION,
  selectStandardLanguages,
} from '../../../testing/speciesSelectionTestUtils'

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
  const featCatalog = createBundledFeatCatalog()

  return (
    <SpeciesPicker
      editionId="srd-2024"
      committedSelection={committedSelection}
      draft={draft}
      catalog={catalog}
      featCatalog={featCatalog}
      onDraftChange={setDraft}
      onCommittedSelectionChange={setCommittedSelection}
    />
  )
}

async function selectAncestryOption(user: ReturnType<typeof userEvent.setup>, label: RegExp) {
  const ancestryTrigger = screen.getByRole('button', {
    name: /choose your draconic ancestor/i,
  })
  if (ancestryTrigger.getAttribute('aria-expanded') !== 'true') {
    await user.click(ancestryTrigger)
  }

  await user.click(screen.getByRole('radio', { name: label }))
}

describe('SpeciesPicker', () => {
  it('shows the ancestry card grid on the first Dragonborn click', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      screen.getByRole('button', { name: /choose your draconic ancestor/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(
      screen.getByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/selected: dragonborn/i),
    ).not.toBeInTheDocument()
    expect(
      document.querySelector(
        '.species-picker__section-accordion-warning',
      ),
    ).not.toBeNull()
  })

  it('does not show ancestry after focus alone when detail would have appeared early', async () => {
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    fireEvent.focus(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      screen.queryByRole('button', { name: /choose your draconic ancestor/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/complete required choices to confirm/i),
    ).not.toBeInTheDocument()
  })

  it('keeps Dwarf as a draft until standard languages are chosen', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    expect(
      screen.getByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()

    await selectStandardLanguages(user)

    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      'Selected: Dwarf',
    )
  })

  it('keeps draft and committed in sync when ancestry and languages are chosen', async () => {
    const user = userEvent.setup()
    render(
      <SpeciesPickerHarness
        initialDraft={createSpeciesSelectionDraft('srd-2024:dragonborn')}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await selectAncestryOption(user, /red \(fire\)/i)
    await selectStandardLanguages(user, [/draconic/i, /common sign language/i])

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
    await selectStandardLanguages(user)
    await user.type(screen.getByRole('searchbox', { name: /search species/i }), 'dragon')

    expect(screen.queryByRole('button', { name: 'Dwarf' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dragonborn' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dwarf/i })).toBeInTheDocument()
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

    await user.type(
      screen.getByRole('searchbox', { name: /search species/i }),
      'zzzz-no-match',
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      /no species match.*zzzz-no-match/i,
    )
    expect(screen.queryByRole('button', { name: 'Dwarf' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dragonborn' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Elf' })).not.toBeInTheDocument()
  })

  it('restores selected card styling after clearing search', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))
    await selectStandardLanguages(user)
    const search = screen.getByRole('searchbox', { name: /search species/i })
    await user.type(search, 'dragon')
    await user.clear(search)

    const selectedCard = screen.getByRole('button', { name: 'Dwarf' })
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
    expect(
      selectedCard.querySelector('.species-picker__card-badge[aria-hidden="true"]'),
    ).not.toBeNull()
  })

  it('renders hero overview, highlights, languages, and traits', async () => {
    const user = userEvent.setup()
    render(<SpeciesPickerHarness />)

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    const detail = document.querySelector('.species-picker__detail')
    expect(detail).not.toBeNull()
    expect(detail?.querySelector('.species-picker__hero')).not.toBeNull()
    expect(detail?.querySelector('.species-picker__detail-icon')).not.toBeNull()
    expect(detail?.querySelector('.species-picker__highlights')).not.toBeNull()
    expect(detail?.querySelector('.species-picker__metadata')).not.toBeNull()
    expect(detail?.querySelectorAll('.species-picker__metadata-item')).toHaveLength(
      2,
    )
    expect(screen.getByRole('heading', { name: /dwarf.*humanoid/i })).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('30 ft.')).toBeInTheDocument()

    const highlights = detail?.querySelector('.species-picker__highlights')
    expect(highlights).not.toBeNull()
    expect(within(highlights as HTMLElement).getByText('Darkvision')).toBeInTheDocument()
    expect(within(highlights as HTMLElement).getByText('120 ft.')).toBeInTheDocument()

    const languagesTrigger = screen.getByRole('button', { name: /languages/i })
    if (languagesTrigger.getAttribute('aria-expanded') !== 'true') {
      await user.click(languagesTrigger)
    }
    expect(screen.getAllByText('Common').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/choose 2 standard languages/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /dwarvish/i })).toBeInTheDocument()

    const traitsTrigger = screen.getByRole('button', { name: /^traits/i })
    if (traitsTrigger.getAttribute('aria-expanded') !== 'true') {
      await user.click(traitsTrigger)
    }
    expect(detail?.querySelectorAll('.species-picker__trait-card')).toHaveLength(4)
    expect(screen.getByRole('heading', { name: 'Darkvision', level: 5 })).toBeInTheDocument()
  })

  it('shows a decorative check badge only on the selected catalogue card', async () => {
    render(
      <SpeciesPickerHarness initialCommitted={{ ...COMPLETE_DWARF_SELECTION }} />,
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })

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

describe('species feature modules', () => {
  it('contain no concrete species-id branching outside tests', () => {
    const speciesDir = path.dirname(fileURLToPath(import.meta.url))
    const featuresDir = path.resolve(speciesDir, '..')
    const forbidden = ['srd-2024:dwarf', 'srd-2024:dragonborn']

    const sourceFiles = readdirSync(featuresDir)
      .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
      .filter((name) => !name.includes('.test.'))

    for (const fileName of sourceFiles) {
      const contents = readFileSync(path.join(featuresDir, fileName), 'utf8')
      for (const token of forbidden) {
        expect(contents.includes(token), `${fileName} must not contain ${token}`).toBe(
          false,
        )
      }
    }
  })
})
