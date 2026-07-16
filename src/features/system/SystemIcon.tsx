import { getSystemIcon, type SystemIconSize } from '../../assets/iconRegistry'

export type SystemIconProps = {
  name: string
  /** System icons are 50px assets. Kept for call-site clarity. */
  size?: SystemIconSize
  className?: string
  /** When set, the image is meaningful and receives this alt text. */
  alt?: string
}

/**
 * Renders a system PNG from the central icon registry.
 * Place inside a warm icon disc (species/class pattern) for consistent chrome.
 */
export function SystemIcon({
  name,
  size = 50,
  className,
  alt,
}: SystemIconProps) {
  const iconSrc = getSystemIcon(name, size)
  const isDecorative = alt === undefined

  if (iconSrc === null) {
    return null
  }

  return (
    <img
      className={className}
      src={iconSrc}
      alt={isDecorative ? '' : alt}
      aria-hidden={isDecorative ? true : undefined}
      draggable={false}
    />
  )
}
