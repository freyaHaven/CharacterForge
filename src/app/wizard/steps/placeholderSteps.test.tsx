// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BackgroundStep } from './BackgroundStep'
import { ClassStep } from './ClassStep'
import { EquipmentStep } from './EquipmentStep'

describe('ClassStep', () => {
  it('renders the heading, explanation, and coming soon notice', () => {
    render(<ClassStep />)

    expect(
      screen.getByRole('heading', { name: 'Class', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/core abilities, combat style, and how they grow/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('does not render interactive selection controls', () => {
    render(<ClassStep />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
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
