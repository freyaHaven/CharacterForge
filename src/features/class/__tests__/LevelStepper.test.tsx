// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LevelStepper } from '../LevelStepper'

function LevelStepperHarness({
  initialValue = 1,
  onChange = vi.fn(),
}: {
  initialValue?: number
  onChange?: (level: number) => void
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <LevelStepper
      value={value}
      onChange={(nextValue) => {
        setValue(nextValue)
        onChange(nextValue)
      }}
    />
  )
}

describe('LevelStepper', () => {
  it('increments and decrements with the stepper buttons', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<LevelStepperHarness initialValue={3} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /increase level/i }))
    expect(onChange).toHaveBeenLastCalledWith(4)

    await user.click(screen.getByRole('button', { name: /decrease level/i }))
    expect(onChange).toHaveBeenLastCalledWith(3)
  })

  it('commits typed values on blur and clamps out-of-range input', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<LevelStepperHarness initialValue={3} onChange={onChange} />)

    const input = screen.getByRole('spinbutton', { name: /starting level/i })
    await user.clear(input)
    await user.type(input, '5')
    fireEvent.blur(input)

    expect(onChange).toHaveBeenLastCalledWith(5)

    await user.clear(input)
    await user.type(input, '25')
    fireEvent.blur(input)

    expect(onChange).toHaveBeenLastCalledWith(20)
    expect(input).toHaveValue(20)
  })

  it('ignores non-numeric input and reverts on blur', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<LevelStepperHarness initialValue={3} onChange={onChange} />)

    const input = screen.getByRole('spinbutton', { name: /starting level/i })
    await user.clear(input)
    await user.type(input, 'abc')
    fireEvent.blur(input)

    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue(3)
  })

  it('commits on Enter and does not emit changes for invalid intermediate typing', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<LevelStepperHarness initialValue={1} onChange={onChange} />)

    const input = screen.getByRole('spinbutton', { name: /starting level/i })
    fireEvent.change(input, { target: { value: '' } })
    await user.type(input, '5')
    expect(onChange).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('disables decrease at minimum level', () => {
    render(<LevelStepperHarness initialValue={1} />)

    expect(screen.getByRole('button', { name: /decrease level/i })).toBeDisabled()
  })

  it('disables increase at maximum level', () => {
    render(<LevelStepperHarness initialValue={20} />)

    expect(screen.getByRole('button', { name: /increase level/i })).toBeDisabled()
  })
})
