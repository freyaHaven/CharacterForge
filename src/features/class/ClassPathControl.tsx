import type { ClassBuildMode } from './classBuildMode'

type ClassPathControlProps = {
  buildMode: ClassBuildMode
  onChangePath: () => void
}

const PATH_LABELS: Record<ClassBuildMode, string> = {
  'single-class': 'Single Class',
  multiclass: 'Multiclass',
}

export function ClassPathControl({
  buildMode,
  onChangePath,
}: ClassPathControlProps) {
  return (
    <div className="class-path-control">
      <span className="class-path-control__label">
        Class path:{' '}
        <span className="class-path-control__value">{PATH_LABELS[buildMode]}</span>
      </span>
      <button type="button" className="class-path-control__change" onClick={onChangePath}>
        Change
      </button>
    </div>
  )
}
