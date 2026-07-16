// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  getCompactColumnCount,
  resolveSingleSelectCardGridLayout,
  shouldSpanFullRow,
  SingleSelectCardGrid,
} from '../SingleSelectCardGrid'

const THREE_OPTION_LAYOUT = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
] as const

const OPTIONS = [
  {
    id: 'equipment-package',
    label: 'Equipment Package (A)',
    description: 'Spear, shortbow, arrows, and travel supplies.',
  },
  {
    id: 'gold-alternative',
    label: '50 GP',
    description: 'Take 50 GP instead of the equipment package.',
  },
] as const

const MUSICAL_INSTRUMENT_OPTIONS = [
  { id: 'bagpipes', label: 'Bagpipes' },
  { id: 'drum', label: 'Drum' },
  { id: 'dulcimer', label: 'Dulcimer' },
  { id: 'flute', label: 'Flute' },
  { id: 'lute', label: 'Lute' },
  { id: 'lyre', label: 'Lyre' },
] as const

describe('getCompactColumnCount', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [7, 2],
    [8, 2],
    [9, 3],
    [10, 2],
    [12, 2],
  ] as const)('returns %i columns for %i options', (optionCount, columns) => {
    expect(getCompactColumnCount(optionCount)).toBe(columns)
  })
})

describe('shouldSpanFullRow', () => {
  it('spans the final option for five- and seven-option grids', () => {
    expect(shouldSpanFullRow(4, 5)).toBe(true)
    expect(shouldSpanFullRow(6, 7)).toBe(true)
    expect(shouldSpanFullRow(3, 4)).toBe(false)
  })

  it('spans the third option for the two-plus-one layout', () => {
    expect(shouldSpanFullRow(2, 3, 'two-plus-one')).toBe(true)
    expect(shouldSpanFullRow(0, 3, 'two-plus-one')).toBe(false)
    expect(shouldSpanFullRow(1, 3, 'two-plus-one')).toBe(false)
  })
})

describe('resolveSingleSelectCardGridLayout', () => {
  it('falls back to default when two-plus-one is used with a non-three-option set', () => {
    expect(resolveSingleSelectCardGridLayout('two-plus-one', 3)).toBe('two-plus-one')
    expect(resolveSingleSelectCardGridLayout('two-plus-one', 4)).toBe('default')
  })
})

describe('SingleSelectCardGrid', () => {
  it('renders a radiogroup with fully clickable option cards', () => {
    render(
      <SingleSelectCardGrid
        id="starting-equipment"
        name="starting-equipment"
        options={OPTIONS}
        selectedOptionId={null}
        onSelect={vi.fn()}
        ariaLabelledBy="equipment-legend"
      />,
    )

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /Equipment Package \(A\)/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^50 GP/i })).toBeInTheDocument()
    expect(document.querySelector('.card-select-choice__card')).toBeInTheDocument()
  })

  it('selects an option when its card label is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <SingleSelectCardGrid
        id="starting-equipment"
        name="starting-equipment"
        options={OPTIONS}
        selectedOptionId={null}
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByText('50 GP'))

    expect(onSelect).toHaveBeenCalledWith('gold-alternative')
  })

  it('marks the selected card visually', () => {
    render(
      <SingleSelectCardGrid
        id="starting-equipment"
        name="starting-equipment"
        options={OPTIONS}
        selectedOptionId="gold-alternative"
        onSelect={vi.fn()}
      />,
    )

    expect(
      document.querySelector('.card-select-choice__card--selected'),
    ).toHaveTextContent('50 GP')
  })

  it('applies compact density and explicit column classes', () => {
    render(
      <SingleSelectCardGrid
        id="gaming-set"
        name="gaming-set"
        options={[
          { id: 'dice-set', label: 'Dice Set' },
          { id: 'dragonchess-set', label: 'Dragonchess Set' },
        ]}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(document.querySelector('.card-select-choice__grid--compact')).toBeInTheDocument()
    expect(document.querySelector('.card-select-choice__grid--cols-2')).toBeInTheDocument()
    expect(document.querySelector('.card-select-choice__card--compact')).toBeInTheDocument()
    expect(
      document.querySelector('.card-select-choice__card--described'),
    ).not.toBeInTheDocument()
  })

  it('applies described density with a single column layout', () => {
    render(
      <SingleSelectCardGrid
        id="starting-equipment"
        name="starting-equipment"
        options={OPTIONS}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(document.querySelector('.card-select-choice__grid--described')).toBeInTheDocument()
    expect(document.querySelector('.card-select-choice__grid--cols-1')).toBeInTheDocument()
    expect(
      document.querySelectorAll('.card-select-choice__card--described'),
    ).toHaveLength(2)
  })

  it('supports keyboard focus on native radio inputs', async () => {
    const user = userEvent.setup()

    render(
      <SingleSelectCardGrid
        id="gaming-set"
        name="gaming-set"
        options={[
          { id: 'dice-set', label: 'Dice Set' },
          { id: 'dragonchess-set', label: 'Dragonchess Set' },
        ]}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    await user.tab()

    expect(screen.getByRole('radio', { name: 'Dice Set' })).toHaveFocus()
  })

  it('renders six compact options with a two-column layout', () => {
    render(
      <SingleSelectCardGrid
        id="musical-instrument"
        name="musical-instrument"
        options={MUSICAL_INSTRUMENT_OPTIONS}
        selectedOptionId={null}
        onSelect={vi.fn()}
        ariaLabelledBy="instrument-legend"
      />,
    )

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    expect(
      document.querySelector('.card-select-choice__grid--compact'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('.card-select-choice__grid--cols-2'),
    ).toBeInTheDocument()
    for (const option of MUSICAL_INSTRUMENT_OPTIONS) {
      expect(
        screen.getByRole('radio', { name: option.label }),
      ).toBeInTheDocument()
    }
  })

  it('uses explicit column classes and span-full for balanced compact layouts', () => {
    const { rerender } = render(
      <SingleSelectCardGrid
        id="gaming-set"
        name="gaming-set"
        options={[
          { id: 'dice-set', label: 'Dice Set' },
          { id: 'dragonchess-set', label: 'Dragonchess Set' },
          { id: 'playing-cards', label: 'Playing Card Set' },
          { id: 'three-dragon-ante', label: 'Three-Dragon Ante Set' },
        ]}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(
      document.querySelector('.card-select-choice__grid--cols-2'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('.card-select-choice__item--span-full'),
    ).not.toBeInTheDocument()

    rerender(
      <SingleSelectCardGrid
        id="sample"
        name="sample"
        options={[
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
          { id: 'three', label: 'Three' },
          { id: 'four', label: 'Four' },
          { id: 'five', label: 'Five' },
        ]}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(
      document.querySelector('.card-select-choice__grid--cols-2'),
    ).toBeInTheDocument()
    expect(
      document.querySelectorAll('.card-select-choice__item--span-full'),
    ).toHaveLength(1)

    rerender(
      <SingleSelectCardGrid
        id="sample"
        name="sample"
        options={Array.from({ length: 9 }, (_, index) => ({
          id: `option-${index + 1}`,
          label: `Option ${index + 1}`,
        }))}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(
      document.querySelector('.card-select-choice__grid--cols-3'),
    ).toBeInTheDocument()
  })

  it('does not select disabled options', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <SingleSelectCardGrid
        id="starting-equipment"
        name="starting-equipment"
        options={[
          ...OPTIONS,
          {
            id: 'locked',
            label: 'Locked option',
            disabled: true,
          },
        ]}
        selectedOptionId={null}
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByText('Locked option'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('keeps the default three-option layout unchanged', () => {
    render(
      <SingleSelectCardGrid
        id="sample"
        name="sample"
        options={THREE_OPTION_LAYOUT}
        selectedOptionId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(
      document.querySelector('.card-select-choice__grid--layout-two-plus-one'),
    ).not.toBeInTheDocument()
    expect(
      document.querySelector('.card-select-choice__grid--cols-2'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('.card-select-choice__item--span-full'),
    ).not.toBeInTheDocument()
  })

  it('emits the two-plus-one modifier and spans the third option', () => {
    render(
      <SingleSelectCardGrid
        id="sample"
        name="sample"
        options={THREE_OPTION_LAYOUT}
        selectedOptionId={null}
        onSelect={vi.fn()}
        layout="two-plus-one"
      />,
    )

    const grid = document.querySelector('.card-select-choice__grid')
    expect(grid).toHaveClass('card-select-choice__grid--layout-two-plus-one')
    expect(grid).toHaveClass('card-select-choice__grid--cols-2')

    const items = document.querySelectorAll('.card-select-choice__item')
    expect(items[2]).toHaveClass('card-select-choice__item--span-full')
    expect(items[0]).not.toHaveClass('card-select-choice__item--span-full')
    expect(items[1]).not.toHaveClass('card-select-choice__item--span-full')
  })

  it('falls back to the default layout when two-plus-one receives a non-three-option set', () => {
    render(
      <SingleSelectCardGrid
        id="sample"
        name="sample"
        options={[
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
          { id: 'three', label: 'Three' },
          { id: 'four', label: 'Four' },
        ]}
        selectedOptionId={null}
        onSelect={vi.fn()}
        layout="two-plus-one"
      />,
    )

    expect(
      document.querySelector('.card-select-choice__grid--layout-two-plus-one'),
    ).not.toBeInTheDocument()
    expect(
      document.querySelector('.card-select-choice__item--span-full'),
    ).not.toBeInTheDocument()
  })

  it('preserves accessibility and selection behaviour for two-plus-one', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <SingleSelectCardGrid
        id="sample"
        name="sample"
        options={THREE_OPTION_LAYOUT}
        selectedOptionId={null}
        onSelect={onSelect}
        layout="two-plus-one"
        ariaLabelledBy="sample-legend"
      />,
    )

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Three' })).toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('radio', { name: 'One' })).toHaveFocus()

    await user.click(screen.getByText('Three'))
    expect(onSelect).toHaveBeenCalledWith('three')
  })
})

