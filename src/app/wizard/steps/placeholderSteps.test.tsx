// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { BackgroundStep } from './BackgroundStep'
import { ClassStep } from './ClassStep'
import { EquipmentStep } from './EquipmentStep'

describe('ClassStep', () => {
  it('renders the class picker catalogue', async () => {
    render(
      <ClassStep
        editionId="srd-2024"
        committedSelection={null}
        draft={null}
        catalog={createBundledClassCatalog()}
        onDraftChange={() => {}}
        onCommittedSelectionChange={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Class', level: 2 }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Fighter' })).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})

describe('BackgroundStep', () => {
  it('renders the heading, explanation, and coming soon notice', () => {
    render(<BackgroundStep />)

    expect(
      screen.getByRole('heading', { name: 'Background', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/life before adventuring/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('does not render interactive selection controls', () => {
    render(<BackgroundStep />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('EquipmentStep', () => {
  it('renders the heading, explanation, and coming soon notice', () => {
    render(<EquipmentStep />)

    expect(
      screen.getByRole('heading', { name: 'Equipment', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/starting weapons, armour, tools, and supplies/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('does not render interactive selection controls', () => {
    render(<EquipmentStep />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
