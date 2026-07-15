import { useEffect, useRef } from 'react'

type ClassModeSwitchDialogProps = {
  open: boolean
  mode: 'to-single' | 'to-multiclass'
  classOptions?: { instanceId: string; className: string }[]
  retainInstanceId: string | null
  onRetainInstanceChange: (instanceId: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function ClassModeSwitchDialog({
  open,
  mode,
  classOptions = [],
  retainInstanceId,
  onRetainInstanceChange,
  onConfirm,
  onCancel,
}: ClassModeSwitchDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      confirmButtonRef.current?.focus()
    }
  }, [open])

  if (!open) {
    return null
  }

  if (mode === 'to-multiclass') {
    return (
      <div
        className="class-picker__mode-dialog"
        role="alertdialog"
        aria-labelledby="class-mode-dialog-heading"
        aria-describedby="class-mode-dialog-description"
      >
        <h3 id="class-mode-dialog-heading">Switch to multiclass?</h3>
        <p id="class-mode-dialog-description">
          Your current class will be kept as the first class in your build. You
          can add another class next.
        </p>
        <div className="class-picker__mode-dialog-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button ref={confirmButtonRef} type="button" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="class-picker__mode-dialog"
      role="alertdialog"
      aria-labelledby="class-mode-dialog-heading"
      aria-describedby="class-mode-dialog-description"
    >
      <h3 id="class-mode-dialog-heading">Switch to single class?</h3>
      <p id="class-mode-dialog-description">
        Only one class can remain. Choose which class to keep. Other classes and
        their choices will be removed.
      </p>
      <fieldset>
        <legend className="visually-hidden">Class to retain</legend>
        {classOptions.map((option) => (
          <label key={option.instanceId} className="class-picker__mode-dialog-option">
            <input
              type="radio"
              name="retain-class"
              value={option.instanceId}
              checked={retainInstanceId === option.instanceId}
              onChange={() => {
                onRetainInstanceChange(option.instanceId)
              }}
            />
            {option.className}
          </label>
        ))}
      </fieldset>
      <div className="class-picker__mode-dialog-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button ref={confirmButtonRef} type="button" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  )
}
