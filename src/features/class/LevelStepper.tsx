import { useEffect, useId, useState } from 'react'
import {
  MAX_CLASS_LEVEL,
  MIN_CLASS_LEVEL,
} from '../../domain/class/types'

export type LevelStepperProps = {
  value: number
  onChange: (level: number) => void
  min?: number
  max?: number
  disabled?: boolean
  label?: string
  compact?: boolean
}

function clampLevel(level: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, level))
}

function parseLevelInput(raw: string): number | null {
  const trimmed = raw.trim()

  if (trimmed.length === 0) {
    return null
  }

  if (!/^\d+$/.test(trimmed)) {
    return null
  }

  return Number.parseInt(trimmed, 10)
}

export function LevelStepper({
  value,
  onChange,
  min = MIN_CLASS_LEVEL,
  max = MAX_CLASS_LEVEL,
  disabled = false,
  label = 'Starting level',
  compact = false,
}: LevelStepperProps) {
  const inputId = useId()
  const [inputValue, setInputValue] = useState(String(value))
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value))
    }
  }, [isEditing, value])

  function commitInput(raw: string) {
    const parsed = parseLevelInput(raw)

    if (parsed === null) {
      setInputValue(String(value))
      return
    }

    const clamped = clampLevel(parsed, min, max)
    setInputValue(String(clamped))

    if (clamped !== value) {
      onChange(clamped)
    }
  }

  function step(delta: number) {
    const next = clampLevel(value + delta, min, max)
    setInputValue(String(next))
    setIsEditing(false)

    if (next !== value) {
      onChange(next)
    }
  }

  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && value < max

  return (
    <div
      className={
        compact
          ? 'level-stepper level-stepper--compact field'
          : 'level-stepper field'
      }
    >
      <label className="level-stepper__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="level-stepper__control">
        <button
          type="button"
          className="level-stepper__button"
          aria-label="Decrease level"
          disabled={!canDecrement}
          onClick={() => {
            step(-1)
          }}
        >
          −
        </button>
        <input
          id={inputId}
          className="level-stepper__input"
          type="number"
          min={min}
          max={max}
          step={1}
          inputMode="numeric"
          value={inputValue}
          disabled={disabled}
          aria-label={label}
          onFocus={() => {
            setIsEditing(true)
          }}
          onChange={(event) => {
            const nextValue = event.target.value

            if (nextValue.length === 0 || /^\d+$/.test(nextValue)) {
              setInputValue(nextValue)
            }
          }}
          onBlur={() => {
            setIsEditing(false)
            commitInput(inputValue)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              setIsEditing(false)
              commitInput(inputValue)
              event.currentTarget.blur()
            }
          }}
        />
        <button
          type="button"
          className="level-stepper__button"
          aria-label="Increase level"
          disabled={!canIncrement}
          onClick={() => {
            step(1)
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
