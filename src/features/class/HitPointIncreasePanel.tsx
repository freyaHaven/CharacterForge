import {
  getHitDieContribution,
  syncHitPointIncreases,
  type HitPointIncrease,
} from '../../domain/class/hitPointIncreases'
import type { HitDie } from '../../domain/class/types'
import { rollHitDie } from '../../rules/hit-points/resolveHitPointMaximum'

export type HitPointIncreasePanelProps = {
  hitDie: HitDie
  level: number
  isStartingClass: boolean
  increases: readonly HitPointIncrease[] | undefined
  onChange: (
    classLevel: number,
    patch: Partial<Pick<HitPointIncrease, 'method' | 'rolledValue'>>,
  ) => void
}

function formatHpGain(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return `+${value}`
}

export function HitPointIncreasePanel({
  hitDie,
  level,
  isStartingClass,
  increases,
  onChange,
}: HitPointIncreasePanelProps) {
  const synced = syncHitPointIncreases(increases, level, { isStartingClass })
  const sides = hitDie.sides

  return (
    <section
      className="class-picker__hit-point-increases"
      aria-labelledby="hit-point-increase-heading"
    >
      <h4 id="hit-point-increase-heading" className="class-picker__subsection-title">
        Hit Point Progression
      </h4>

      <div className="class-picker__hit-point-table-wrap">
        <table className="class-picker__hit-point-table">
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">Method</th>
              <th scope="col">HP Gain</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {synced.map((increase) => {
              const isLockedMax =
                increase.classLevel === 1 &&
                isStartingClass &&
                increase.method === 'max'
              const groupName = `hit-point-increase-${increase.classLevel}`
              const hpGain = getHitDieContribution(increase, sides)
              const canReroll = increase.method === 'roll'

              return (
                <tr key={increase.classLevel}>
                  <th scope="row">{increase.classLevel}</th>
                  <td>
                    {isLockedMax ? (
                      <span className="class-picker__hit-point-method-locked">
                        Maximum
                      </span>
                    ) : (
                      <div
                        className="class-picker__hit-point-method-radios"
                        role="radiogroup"
                        aria-label={`Hit point increase for level ${increase.classLevel}`}
                      >
                        <div className="class-picker__hit-point-method-option">
                          <input
                            id={`${groupName}-fixed`}
                            type="radio"
                            name={groupName}
                            checked={increase.method === 'fixed'}
                            onChange={() => {
                              onChange(increase.classLevel, { method: 'fixed' })
                            }}
                          />
                          <label htmlFor={`${groupName}-fixed`}>Fixed</label>
                        </div>
                        <div className="class-picker__hit-point-method-option">
                          <input
                            id={`${groupName}-roll`}
                            type="radio"
                            name={groupName}
                            checked={increase.method === 'roll'}
                            onChange={() => {
                              onChange(increase.classLevel, {
                                method: 'roll',
                                rolledValue: rollHitDie(sides),
                              })
                            }}
                          />
                          <label htmlFor={`${groupName}-roll`}>Roll</label>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="class-picker__hit-point-gain">
                    {formatHpGain(hpGain)}
                  </td>
                  <td className="class-picker__hit-point-action">
                    {canReroll ? (
                      <button
                        type="button"
                        className="class-picker__hit-point-reroll"
                        onClick={() => {
                          onChange(increase.classLevel, {
                            method: 'roll',
                            rolledValue: rollHitDie(sides),
                          })
                        }}
                      >
                        {increase.rolledValue === undefined ? 'Roll' : 'Re-roll'}
                      </button>
                    ) : (
                      <span aria-hidden="true">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
