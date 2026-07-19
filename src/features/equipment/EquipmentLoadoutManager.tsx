import { useMemo, useState } from 'react'
import type {
  EquipmentItemDefinition,
  EquipmentLoadout,
} from '../../domain/equipment/types'
import {
  formatOffHandSlotLabel,
  isItemEquipped,
  isTwoHandedGrip,
  previewEquipItem,
  previewSetVersatileGrip,
  previewUnequipItem,
  type EquipPreview,
} from '../../domain/equipment/equipmentLoadout'
import type { ResolvedInventoryItem } from '../../rules/character/resolveCharacterEquipment'
import { formatInventoryLine } from './formatEquipment'
import { isEquippableItem } from './isEquippableItem'

export type EquipmentLoadoutManagerProps = {
  inventory: readonly ResolvedInventoryItem[]
  loadout: EquipmentLoadout
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  onChangeLoadout: (next: EquipmentLoadout) => void
  /** List non-equippable owned items (packs, ammo, tools) below usable gear. */
  showNonEquippableItems?: boolean
}

type SlotId = 'armor' | 'mainHand' | 'offHand'

function itemName(
  itemId: string | null,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): string {
  if (itemId === null) {
    return '—'
  }
  return definitionsById.get(itemId)?.name ?? itemId
}

export function EquipmentLoadoutManager({
  inventory,
  loadout,
  definitionsById,
  onChangeLoadout,
  showNonEquippableItems = false,
}: EquipmentLoadoutManagerProps) {
  const [pendingEquip, setPendingEquip] = useState<{
    itemId: string
    preview: EquipPreview
  } | null>(null)

  const offHandOccupiedByTwoHanded = isTwoHandedGrip(loadout, definitionsById)
  const mainHandDefinition =
    loadout.mainHandItemId === null
      ? undefined
      : definitionsById.get(loadout.mainHandItemId)
  const mainHandIsVersatile = mainHandDefinition?.handUsage === 'versatile'

  const { otherUsable, nonEquippable } = useMemo(() => {
    const usable: ResolvedInventoryItem[] = []
    const other: ResolvedInventoryItem[] = []

    for (const item of inventory) {
      const definition = definitionsById.get(item.itemId)
      if (!isEquippableItem(definition)) {
        other.push(item)
        continue
      }
      if (isItemEquipped(loadout, item.itemId)) {
        continue
      }
      usable.push(item)
    }

    return { otherUsable: usable, nonEquippable: other }
  }, [definitionsById, inventory, loadout])

  const requestEquip = (itemId: string) => {
    const preview = previewEquipItem(loadout, itemId, definitionsById)
    if (preview.hasConflict) {
      setPendingEquip({ itemId, preview })
      return
    }
    onChangeLoadout(preview.nextLoadout)
  }

  const requestGripChange = (grip: 'one-handed' | 'two-handed') => {
    if (loadout.mainHandGrip === grip) {
      return
    }
    const preview = previewSetVersatileGrip(loadout, grip, definitionsById)
    if (preview.hasConflict) {
      setPendingEquip({
        itemId: loadout.mainHandItemId ?? '',
        preview,
      })
      return
    }
    onChangeLoadout(preview.nextLoadout)
  }

  const confirmPendingEquip = () => {
    if (pendingEquip === null) {
      return
    }
    onChangeLoadout(pendingEquip.preview.nextLoadout)
    setPendingEquip(null)
  }

  const unequipSlot = (slot: SlotId) => {
    const itemId =
      slot === 'armor'
        ? loadout.armorItemId
        : slot === 'mainHand'
          ? loadout.mainHandItemId
          : loadout.offHandItemId
    if (itemId === null) {
      return
    }
    onChangeLoadout(previewUnequipItem(loadout, itemId))
  }

  const renderEquippedAction = (slot: SlotId, equippedItemId: string | null) => {
    if (equippedItemId === null) {
      return null
    }

    return (
      <button
        type="button"
        className="equipment-loadout__action"
        onClick={() => unequipSlot(slot)}
        aria-label={`Unequip ${itemName(equippedItemId, definitionsById)}`}
      >
        Equipped
      </button>
    )
  }

  return (
    <div className="equipment-loadout">
      <div className="equipment-loadout__slots" aria-label="Equipment slots">
        <div className="equipment-loadout__slot">
          <h4 className="equipment-loadout__slot-heading">Armour</h4>
          <div className="equipment-loadout__item">
            <span className="equipment-loadout__item-name">
              {itemName(loadout.armorItemId, definitionsById)}
            </span>
            {renderEquippedAction('armor', loadout.armorItemId)}
          </div>
        </div>

        <div className="equipment-loadout__slot">
          <h4 className="equipment-loadout__slot-heading">Main Hand</h4>
          <div className="equipment-loadout__item">
            <span className="equipment-loadout__item-name">
              {itemName(loadout.mainHandItemId, definitionsById)}
            </span>
            {renderEquippedAction('mainHand', loadout.mainHandItemId)}
          </div>
          {mainHandIsVersatile ? (
            <fieldset className="equipment-loadout__grip">
              <legend className="equipment-loadout__grip-legend">Grip</legend>
              <label className="equipment-loadout__grip-option">
                <input
                  type="radio"
                  name="equipment-main-hand-grip"
                  checked={loadout.mainHandGrip !== 'two-handed'}
                  onChange={() => requestGripChange('one-handed')}
                />
                One-handed
              </label>
              <label className="equipment-loadout__grip-option">
                <input
                  type="radio"
                  name="equipment-main-hand-grip"
                  checked={loadout.mainHandGrip === 'two-handed'}
                  onChange={() => requestGripChange('two-handed')}
                />
                Two-handed
              </label>
            </fieldset>
          ) : null}
        </div>

        <div className="equipment-loadout__slot">
          <h4 className="equipment-loadout__slot-heading">Off Hand</h4>
          <div className="equipment-loadout__item">
            <span className="equipment-loadout__item-name">
              {offHandOccupiedByTwoHanded
                ? '—'
                : itemName(loadout.offHandItemId, definitionsById)}
            </span>
            {offHandOccupiedByTwoHanded ? (
              <span className="equipment-loadout__slot-status">
                {formatOffHandSlotLabel(loadout, definitionsById)}
              </span>
            ) : (
              renderEquippedAction('offHand', loadout.offHandItemId)
            )}
          </div>
        </div>
      </div>

      {otherUsable.length > 0 ? (
        <div className="equipment-loadout__other">
          <h4 className="equipment-loadout__other-heading">
            Other usable equipment
          </h4>
          <ul className="equipment-step__summary-list">
            {otherUsable.map((item) => (
              <li key={item.itemId} className="equipment-loadout__item">
                <span className="equipment-loadout__item-name">
                  {formatInventoryLine(item)}
                </span>
                <button
                  type="button"
                  className="equipment-loadout__action"
                  onClick={() => requestEquip(item.itemId)}
                >
                  Equip
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showNonEquippableItems && nonEquippable.length > 0 ? (
        <div className="equipment-loadout__other">
          <h4 className="equipment-loadout__other-heading">Other items</h4>
          <ul className="equipment-step__summary-list">
            {nonEquippable.map((item) => (
              <li key={item.itemId} className="equipment-loadout__item">
                <span className="equipment-loadout__item-name">
                  <span aria-hidden="true">✓ </span>
                  {formatInventoryLine(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pendingEquip !== null ? (
        <div
          className="equipment-loadout__confirm"
          role="alertdialog"
          aria-labelledby="equipment-equip-confirm-title"
          aria-describedby="equipment-equip-confirm-message"
        >
          <h4 id="equipment-equip-confirm-title">Replace equipped item?</h4>
          <p id="equipment-equip-confirm-message">
            {pendingEquip.preview.message}
          </p>
          <div className="equipment-loadout__confirm-actions">
            <button type="button" onClick={confirmPendingEquip}>
              Equip{' '}
              {definitionsById.get(pendingEquip.itemId)?.name ??
                pendingEquip.itemId}
            </button>
            <button type="button" onClick={() => setPendingEquip(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
