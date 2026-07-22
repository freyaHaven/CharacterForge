// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import type { ResolvedInventoryEntry } from '../../../rules/character/resolveCharacterEquipment'
import { InventoryPage } from '../InventoryPage'

const backpackId = 'inst:backpack'
const quiverId = 'inst:quiver'

function entry(
  partial: Partial<ResolvedInventoryEntry> &
    Pick<ResolvedInventoryEntry, 'instanceId' | 'itemId' | 'name'>,
): ResolvedInventoryEntry {
  return {
    quantity: 1,
    category: 'gear',
    location: { kind: 'carried' },
    weightLb: 1,
    costGp: 1,
    notes: '',
    tags: [],
    isContainer: false,
    ...partial,
  }
}

const sampleEntries: ResolvedInventoryEntry[] = [
  entry({
    instanceId: backpackId,
    itemId: 'srd-2024:backpack',
    name: 'Backpack',
    category: 'container',
    isContainer: true,
    weightLb: 5,
    costGp: 2,
  }),
  entry({
    instanceId: quiverId,
    itemId: 'srd-2024:quiver',
    name: 'Quiver',
    category: 'container',
    isContainer: true,
    weightLb: 1,
    costGp: 1,
  }),
  entry({
    instanceId: 'inst:chain-mail',
    itemId: 'srd-2024:chain-mail',
    name: 'Chain Mail',
    category: 'armor',
    weightLb: 55,
    costGp: 75,
  }),
  entry({
    instanceId: 'inst:arrows',
    itemId: 'srd-2024:arrows',
    name: 'Arrows',
    category: 'ammunition',
    quantity: 20,
    location: { kind: 'container', containerInstanceId: quiverId },
    weightLb: 0.05,
    costGp: 0.05,
  }),
  entry({
    instanceId: 'inst:torch',
    itemId: 'srd-2024:torch',
    name: 'Torch',
    quantity: 10,
    location: { kind: 'container', containerInstanceId: backpackId },
    weightLb: 1,
    costGp: 0.01,
  }),
  entry({
    instanceId: 'inst:mystery',
    itemId: 'homebrew:mystery-orb',
    name: 'Mystery Orb',
    category: 'gear',
    weightLb: null,
    costGp: null,
  }),
]

function okResult() {
  return {
    ok: true as const,
    equipment: {
      selections: [],
      inventory: {
        entries: [],
        currency: { goldPieces: 0 },
        seededFromStartingEquipment: true,
      },
      loadout: EMPTY_EQUIPMENT_LOADOUT,
    },
  }
}

function renderPage(
  overrides: Partial<ComponentProps<typeof InventoryPage>> = {},
) {
  const props = {
    entries: sampleEntries,
    loadout: {
      ...EMPTY_EQUIPMENT_LOADOUT,
      armorItemId: 'srd-2024:chain-mail',
    },
    goldPieces: 18,
    weightCarriedLb: 72,
    definitionsById: SRD_2024_EQUIPMENT_BY_ID,
    seeded: true,
    onSetQuantity: vi.fn(async () => okResult()),
    onAdjustQuantity: vi.fn(async () => okResult()),
    onRemove: vi.fn(async () => okResult()),
    onMove: vi.fn(async () => okResult()),
    onSplit: vi.fn(async () => okResult()),
    onMerge: vi.fn(async () => okResult()),
    onSetCurrency: vi.fn(async () => okResult()),
    onAdjustCurrency: vi.fn(async () =>
      okResult(),
    ),
    ...overrides,
  }

  render(<InventoryPage {...props} />)
  return props
}

describe('InventoryPage', () => {
  it('renders inventory heading, currency, and persisted entries', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Inventory' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/18 gp/i)).toBeInTheDocument()
    expect(screen.getByText('Chain Mail')).toBeInTheDocument()
    expect(screen.getByText('Equipped')).toBeInTheDocument()
  })

  it('shows unknown catalogue items with a fallback label', () => {
    renderPage()
    expect(screen.getByText('Mystery Orb')).toBeInTheDocument()
    expect(screen.getByText(/Unknown catalogue item/i)).toBeInTheDocument()
  })

  it('filters by name search within the active view', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText(/search by name/i), 'arrow')
    expect(screen.getByText('Arrows')).toBeInTheDocument()
    expect(screen.queryByText('Torch')).not.toBeInTheDocument()
  })

  it('filters All, Carried, and container tabs', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Carried' }))
    expect(screen.getByText('Chain Mail')).toBeInTheDocument()
    expect(screen.queryByText('Arrows')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Quiver' }))
    expect(screen.getByText('Arrows')).toBeInTheDocument()
    expect(screen.queryByText('Torch')).not.toBeInTheDocument()
  })

  it('exposes quantity increase and decrease', async () => {
    const user = userEvent.setup()
    const props = renderPage()

    await user.click(
      screen.getByRole('button', { name: /increase arrows quantity/i }),
    )
    expect(props.onAdjustQuantity).toHaveBeenCalledWith('inst:arrows', 1)

    await user.click(
      screen.getByRole('button', { name: /decrease arrows quantity/i }),
    )
    expect(props.onAdjustQuantity).toHaveBeenCalledWith('inst:arrows', -1)
  })

  it('confirms removal instead of silently deleting on last decrement', async () => {
    const user = userEvent.setup()
    const props = renderPage({
      entries: [
        entry({
          instanceId: 'inst:dagger',
          itemId: 'srd-2024:dagger',
          name: 'Dagger',
          quantity: 1,
        }),
      ],
    })

    await user.click(
      screen.getByRole('button', { name: /decrease dagger quantity/i }),
    )
    expect(props.onAdjustQuantity).not.toHaveBeenCalled()
    expect(
      screen.getByRole('alertdialog', { name: /remove from inventory/i }),
    ).toBeInTheDocument()

    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Remove',
      }),
    )
    expect(props.onRemove).toHaveBeenCalledWith('inst:dagger')
  })

  it('moves items into containers and reports invalid destinations via mutation result', async () => {
    const user = userEvent.setup()
    const props = renderPage({
      onMove: vi.fn(async () => ({
        ok: false as const,
        reason: 'container-cycle' as const,
      })),
    })

    const moveSelect = screen.getByLabelText(/move chain mail/i)
    await user.selectOptions(moveSelect, backpackId)
    expect(props.onMove).toHaveBeenCalledWith('inst:chain-mail', {
      kind: 'container',
      containerInstanceId: backpackId,
    })
    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(/nest a container inside itself/i)
  })

  it('splits stacks through the split form', async () => {
    const user = userEvent.setup()
    const props = renderPage()

    const arrowRow = screen.getByText('Arrows').closest('tr')
    expect(arrowRow).not.toBeNull()
    await user.click(within(arrowRow!).getByRole('button', { name: 'Split' }))
    await user.clear(screen.getByLabelText(/split quantity/i))
    await user.type(screen.getByLabelText(/split quantity/i), '5')
    await user.click(screen.getByRole('button', { name: /confirm split/i }))
    expect(props.onSplit).toHaveBeenCalledWith('inst:arrows', 5)
  })

  it('offers merge only for compatible stacks', async () => {
    const user = userEvent.setup()
    const props = renderPage({
      entries: [
        entry({
          instanceId: 'arrows:a',
          itemId: 'srd-2024:arrows',
          name: 'Arrows',
          quantity: 10,
        }),
        entry({
          instanceId: 'arrows:b',
          itemId: 'srd-2024:arrows',
          name: 'Arrows',
          quantity: 5,
        }),
        entry({
          instanceId: 'torch:a',
          itemId: 'srd-2024:torch',
          name: 'Torch',
          quantity: 3,
        }),
      ],
    })

    const mergeSelects = screen.getAllByLabelText(/merge arrows into/i)
    expect(mergeSelects.length).toBeGreaterThan(0)
    await user.selectOptions(mergeSelects[0]!, 'arrows:b')
    expect(props.onMerge).toHaveBeenCalledWith('arrows:b', 'arrows:a')
    expect(screen.queryByLabelText(/merge torch into/i)).not.toBeInTheDocument()
  })

  it('explains container content ejection on remove confirmation', async () => {
    const user = userEvent.setup()
    renderPage()

    const backpackName = screen
      .getAllByText('Backpack')
      .find((node) => node.classList.contains('inventory-page__item-name'))
    expect(backpackName).toBeDefined()
    const backpackRow = backpackName!.closest('tr')
    await user.click(
      within(backpackRow!).getByRole('button', { name: 'Remove' }),
    )
    expect(
      screen.getByText(/contents will be moved to carried inventory/i),
    ).toBeInTheDocument()
  })

  it('edits currency and surfaces negative validation', async () => {
    const user = userEvent.setup()
    const props = renderPage({
      onSetCurrency: vi.fn(async () => ({
        ok: false as const,
        reason: 'negative-currency' as const,
      })),
    })

    const goldInput = screen.getByLabelText(/gold pieces/i)
    await user.clear(goldInput)
    await user.type(goldInput, '-3')
    await user.tab()
    expect(props.onSetCurrency).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/zero or more/i)

    await user.clear(goldInput)
    await user.type(goldInput, '40')
    props.onSetCurrency.mockResolvedValueOnce(okResult())
    await user.click(screen.getByRole('button', { name: 'Set' }))
    expect(props.onSetCurrency).toHaveBeenCalledWith(40)
  })

  it('disables mutation controls when inventory is not seeded', () => {
    renderPage({ seeded: false })
    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(/editing unlocks after starting equipment/i)
    expect(
      screen.getByRole('button', { name: /increase arrows quantity/i }),
    ).toBeDisabled()
  })
})
