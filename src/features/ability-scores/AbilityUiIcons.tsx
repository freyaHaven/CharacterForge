import type { AbilityScoreKey } from './abilityScoreDisplay'
import { SystemIcon } from '../system/SystemIcon'

export function AbilityStatIcon({
  abilityKey,
  className,
  size = 50,
}: {
  abilityKey: AbilityScoreKey
  className?: string
  size?: 50
}) {
  return <SystemIcon name={abilityKey} size={size} className={className} />
}
