import type { ClassBuildMode } from './classBuildMode'

type ClassPathIntroProps = {
  onSelect: (mode: ClassBuildMode) => void
}

const PATH_OPTIONS = [
  {
    mode: 'single-class' as const,
    title: 'Single Class',
    description: 'Build your character using one class.',
  },
  {
    mode: 'multiclass' as const,
    title: 'Multiclass',
    description: 'Combine levels from two or more classes.',
  },
]

export function ClassPathIntro({ onSelect }: ClassPathIntroProps) {
  return (
    <fieldset className="class-path-intro">
      <legend id="class-path-intro-legend" className="class-path-intro__legend">
        How will your character gain their class levels?
      </legend>
      <div
        className="class-path-intro__options"
        role="radiogroup"
        aria-labelledby="class-path-intro-legend"
      >
        {PATH_OPTIONS.map((option) => (
          <label key={option.mode} className="class-path-intro__option">
            <input
              type="radio"
              name="class-path"
              value={option.mode}
              onChange={() => {
                onSelect(option.mode)
              }}
            />
            <span className="class-path-intro__option-content">
              <span className="class-path-intro__option-title">
                {option.title}
              </span>
              <span className="class-path-intro__option-description">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
