// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import { DEFAULT_ABILITY_SCORES } from '../../../domain/character/defaults'
import type { ResolvedInventoryEntry } from '../../../rules/character/resolveCharacterEquipment'
import { InventoryPanel } from '../InventoryPanel'

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
    notes: 'Heavy Armour',
    tags: ['heavy', 'armor'],
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
    notes: 'Ammunition',
    tags: ['ammunition'],
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
]

describe('InventoryPanel', () => {
  it('renders weight, currency, location tabs, and filters by container', async () => {
    const user = userEvent.setup()

    render(
      <InventoryPanel
        entries={sampleEntries}
        loadout={{
          ...EMPTY_EQUIPMENT_LOADOUT,
          armorItemId: 'srd-2024:chain-mail',
        }}
        weightCarriedLb={62.1}
        goldPieces={18}
        abilityScores={DEFAULT_ABILITY_SCORES}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={vi.fn()}
      />,
    )

    expect(screen.getByText(/weight carried: 62\.1 lb/i)).toBeInTheDocument()
    expect(screen.getByText('Unencumbered')).toBeInTheDocument()
    expect(screen.getByText('18 GP')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Equipment' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Backpack' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Quiver' })).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Equip Chain Mail' }),
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Equip Backpack' }),
    ).toBeDisabled()

    await user.click(screen.getByRole('tab', { name: 'Quiver' }))
    expect(screen.getByText('Arrows')).toBeInTheDocument()
    expect(screen.queryByText('Torch')).not.toBeInTheDocument()
    expect(screen.queryByText('Chain Mail')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Equipment' }))
    expect(screen.getByText('Chain Mail')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Equip Backpack' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Arrows')).not.toBeInTheDocument()
  })

  it('toggles equip state through the equipped checkbox', async () => {
    const user = userEvent.setup()
    const onChangeLoadout = vi.fn()

    render(
      <InventoryPanel
        entries={sampleEntries}
        loadout={{
          ...EMPTY_EQUIPMENT_LOADOUT,
          armorItemId: 'srd-2024:chain-mail',
        }}
        weightCarriedLb={62.1}
        goldPieces={0}
        abilityScores={DEFAULT_ABILITY_SCORES}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={onChangeLoadout}
      />,
    )

    await user.click(
      screen.getByRole('checkbox', { name: 'Equip Chain Mail' }),
    )

    expect(onChangeLoadout).toHaveBeenCalledWith({
      armorItemId: null,
      mainHandItemId: null,
      offHandItemId: null,
      mainHandGrip: null,
    })
  })

  it('filters rows by search across name, tags, and container', async () => {
    const user = userEvent.setup()

    render(
      <InventoryPanel
        entries={sampleEntries}
        loadout={EMPTY_EQUIPMENT_LOADOUT}
        weightCarriedLb={62.1}
        goldPieces={0}
        abilityScores={DEFAULT_ABILITY_SCORES}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={vi.fn()}
      />,
    )

    await user.type(screen.getByPlaceholderText('Search items...'), 'quiver')
    expect(screen.getByText('Arrows')).toBeInTheDocument()
    expect(screen.queryByText('Torch')).not.toBeInTheDocument()
  })
})
