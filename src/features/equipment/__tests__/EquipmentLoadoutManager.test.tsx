/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import type { EquipmentLoadout } from '../../../domain/equipment/types'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import type { ResolvedInventoryItem } from '../../../rules/character/resolveCharacterEquipment'
import { EquipmentLoadoutManager } from '../EquipmentLoadoutManager'

function inventoryItem(
  itemId: string,
  quantity = 1,
): ResolvedInventoryItem {
  const definition = SRD_2024_EQUIPMENT_BY_ID.get(itemId)!
  return {
    itemId,
    name: definition.name,
    quantity,
    category: definition.category,
  }
}

const inventory = [
  inventoryItem('srd-2024:chain-mail'),
  inventoryItem('srd-2024:greatsword'),
  inventoryItem('srd-2024:flail'),
  inventoryItem('srd-2024:longbow'),
  inventoryItem('srd-2024:shield'),
  inventoryItem('srd-2024:arrows', 20),
]

const equippedLoadout: EquipmentLoadout = {
  armorItemId: 'srd-2024:chain-mail',
  mainHandItemId: 'srd-2024:greatsword',
  offHandItemId: null,
  mainHandGrip: null,
}

describe('EquipmentLoadoutManager', () => {
  it('displays the three loadout slots and other usable equipment', () => {
    render(
      <EquipmentLoadoutManager
        inventory={inventory}
        loadout={equippedLoadout}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={vi.fn()}
      />,
    )

    const slots = screen.getByLabelText('Equipment slots')
    expect(within(slots).getByRole('heading', { name: 'Armour' })).toBeInTheDocument()
    expect(within(slots).getByRole('heading', { name: 'Main Hand' })).toBeInTheDocument()
    expect(within(slots).getByRole('heading', { name: 'Off Hand' })).toBeInTheDocument()
    expect(within(slots).getByText('Chain Mail')).toBeInTheDocument()
    expect(within(slots).getByText('Greatsword')).toBeInTheDocument()
    expect(within(slots).getByText(/Occupied by Greatsword/i)).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'Other usable equipment' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Longbow')).toBeInTheDocument()
    expect(screen.getByText('Flail')).toBeInTheDocument()
    expect(screen.getByText('Shield')).toBeInTheDocument()
    expect(screen.queryByText(/Arrows/)).not.toBeInTheDocument()
  })

  it('marks currently equipped items and exposes Equip for owned alternatives', () => {
    render(
      <EquipmentLoadoutManager
        inventory={inventory}
        loadout={equippedLoadout}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Unequip Chain Mail' }),
    ).toHaveTextContent('Equipped')
    expect(
      screen.getByRole('button', { name: 'Unequip Greatsword' }),
    ).toHaveTextContent('Equipped')

    const other = screen
      .getByRole('heading', { name: 'Other usable equipment' })
      .closest('.equipment-loadout__other')
    expect(other).not.toBeNull()
    expect(
      within(other as HTMLElement).getAllByRole('button', { name: 'Equip' }),
    ).toHaveLength(3)
  })

  it('confirms two-handed weapon conflicts with an equipped shield', async () => {
    const user = userEvent.setup()
    const onChangeLoadout = vi.fn()
    const loadout: EquipmentLoadout = {
      armorItemId: 'srd-2024:chain-mail',
      mainHandItemId: 'srd-2024:flail',
      offHandItemId: 'srd-2024:shield',
      mainHandGrip: null,
    }

    render(
      <EquipmentLoadoutManager
        inventory={inventory}
        loadout={loadout}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={onChangeLoadout}
      />,
    )

    const other = screen
      .getByRole('heading', { name: 'Other usable equipment' })
      .closest('.equipment-loadout__other') as HTMLElement
    const greatswordRow = within(other)
      .getByText('Greatsword')
      .closest('li') as HTMLElement
    await user.click(within(greatswordRow).getByRole('button', { name: 'Equip' }))

    expect(onChangeLoadout).not.toHaveBeenCalled()
    expect(
      screen.getByRole('alertdialog', { name: /replace equipped item/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Equipping Greatsword will unequip Flail and Shield because Greatsword requires both hands/i,
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onChangeLoadout).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('alertdialog', { name: /replace equipped item/i }),
    ).not.toBeInTheDocument()

    await user.click(within(greatswordRow).getByRole('button', { name: 'Equip' }))
    await user.click(screen.getByRole('button', { name: 'Equip Greatsword' }))

    expect(onChangeLoadout).toHaveBeenCalledWith({
      armorItemId: 'srd-2024:chain-mail',
      mainHandItemId: 'srd-2024:greatsword',
      offHandItemId: null,
      mainHandGrip: null,
    })
  })

  it('confirms shield conflicts with a two-handed main-hand weapon', async () => {
    const user = userEvent.setup()
    const onChangeLoadout = vi.fn()

    render(
      <EquipmentLoadoutManager
        inventory={inventory}
        loadout={equippedLoadout}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={onChangeLoadout}
      />,
    )

    const other = screen
      .getByRole('heading', { name: 'Other usable equipment' })
      .closest('.equipment-loadout__other') as HTMLElement
    const shieldRow = within(other)
      .getByText('Shield')
      .closest('li') as HTMLElement
    await user.click(within(shieldRow).getByRole('button', { name: 'Equip' }))

    expect(
      screen.getByText(/Equipping Shield will unequip Greatsword/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Equip Shield/i }))
    expect(onChangeLoadout).toHaveBeenCalledWith({
      armorItemId: 'srd-2024:chain-mail',
      mainHandItemId: null,
      offHandItemId: 'srd-2024:shield',
      mainHandGrip: null,
    })
  })

  it('allows selecting versatile grip and conflicts when switching to two-handed', async () => {
    const user = userEvent.setup()
    const onChangeLoadout = vi.fn()
    const loadout: EquipmentLoadout = {
      armorItemId: null,
      mainHandItemId: 'srd-2024:longsword',
      offHandItemId: 'srd-2024:shield',
      mainHandGrip: 'one-handed',
    }

    render(
      <EquipmentLoadoutManager
        inventory={[
          inventoryItem('srd-2024:longsword'),
          inventoryItem('srd-2024:shield'),
        ]}
        loadout={loadout}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={onChangeLoadout}
      />,
    )

    await user.click(screen.getByLabelText('Two-handed'))
    expect(screen.getByText(/requires both hands/i)).toBeInTheDocument()
    const dialog = screen.getByRole('alertdialog', {
      name: /replace equipped item/i,
    })
    await user.click(within(dialog).getByRole('button', { name: 'Equip Longsword' }))
    expect(onChangeLoadout).toHaveBeenCalledWith({
      armorItemId: null,
      mainHandItemId: 'srd-2024:longsword',
      offHandItemId: null,
      mainHandGrip: 'two-handed',
    })
  })

  it('does not offer Equip for non-equippable inventory items', () => {
    render(
      <EquipmentLoadoutManager
        inventory={inventory}
        loadout={EMPTY_EQUIPMENT_LOADOUT}
        definitionsById={SRD_2024_EQUIPMENT_BY_ID}
        onChangeLoadout={vi.fn()}
        showNonEquippableItems
      />,
    )

    expect(screen.getByText(/Arrows/)).toBeInTheDocument()
    const arrowsRow = screen.getByText(/Arrows/).closest('li') as HTMLElement
    expect(within(arrowsRow).queryByRole('button')).toBeNull()
  })
})
