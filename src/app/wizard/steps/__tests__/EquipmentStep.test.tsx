// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBundledEquipmentCatalog } from '../../../../adapters/bundledEquipmentCatalog'
import { EquipmentStep } from '../EquipmentStep'

const emptyResolved = {
  sources: [],
  entries: [],
  inventory: [],
  mergedInventory: [],
  currency: { goldPieces: 0 },
  weightCarriedLb: 0,
}

const equipmentCatalog = createBundledEquipmentCatalog()

describe('EquipmentStep', () => {
  it('renders the heading and empty-state guidance', () => {
    render(
      <EquipmentStep
        resolved={emptyResolved}
        selections={[]}
        onChangeSelections={() => {}}
        validationIssues={[]}
        equipmentCatalog={equipmentCatalog}
        editionId="srd-2024"
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Equipment', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/choose the equipment your character starts with/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/select a class \(and optionally a background\)/i),
    ).toBeInTheDocument()
    expect(screen.queryByText('Starting Equipment')).not.toBeInTheDocument()
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})
