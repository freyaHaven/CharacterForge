// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../../domain/equipment/types'
import { EquipmentStep } from '../EquipmentStep'

const emptyResolved = {
  sources: [],
  inventory: [],
  currency: { goldPieces: 0 },
}

const equipmentCatalog = {
  getEquipment: vi.fn(async () => null),
  listEquipment: vi.fn(async () => []),
}

describe('EquipmentStep', () => {
  it('renders the heading and empty-state guidance', () => {
    render(
      <EquipmentStep
        resolved={emptyResolved}
        selections={[]}
        loadout={EMPTY_EQUIPMENT_LOADOUT}
        equipmentCatalog={equipmentCatalog}
        onChangeSelections={() => {}}
        onChangeLoadout={() => {}}
        validationIssues={[]}
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
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})
