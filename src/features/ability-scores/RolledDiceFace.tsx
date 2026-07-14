import type { DieValue } from '../../rules/rolled'

type RolledDiceFaceProps = {
  value: DieValue | null
  dropped?: boolean
  revealed?: boolean
  ariaLabel: string
}

export function RolledDiceFace({
  value,
  dropped = false,
  revealed = false,
  ariaLabel,
}: RolledDiceFaceProps) {
  return (
    <div
      className={[
        'rolled-die',
        revealed ? 'rolled-die--revealed' : 'rolled-die--hidden',
        dropped ? 'rolled-die--dropped' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      role="img"
    >
      <span className="rolled-die__value">{value ?? '?'}</span>
    </div>
  )
}
