import { getClassIconAsset } from './classIconRegistry'

type ClassIconProps = {
  classId: string
  className?: string
}

function DefaultClassIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        fill="currentColor"
        d="M24 12c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm-12 22c0 4.4 5.4 8 12 8s12-3.6 12-8H12Z"
      />
    </svg>
  )
}

export function ClassIcon({ classId, className }: ClassIconProps) {
  const iconSrc = getClassIconAsset(classId)

  if (iconSrc !== null) {
    return (
      <img
        className={className}
        src={iconSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    )
  }

  return <DefaultClassIcon className={className} />
}
