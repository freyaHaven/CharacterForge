import { describe, expect, it } from 'vitest'
import { migrateV10ToV11 } from '../migrateV10ToV11'
import { createDefaultCharacter } from '../../../../domain/character/defaults'

describe('migrateV10ToV11', () => {
  it('adds default hit point increases to class instances', () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {},
        },
      ],
      startingClassInstanceId: 'fighter-1',
    })

    expect(
      migrateV10ToV11({
        schemaVersion: 10,
        character,
      }),
    ).toEqual({
      schemaVersion: 11,
      character: {
        ...character,
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {},
            hitPointIncreases: [
              { classLevel: 1, method: 'max' },
              { classLevel: 2, method: 'fixed' },
              { classLevel: 3, method: 'fixed' },
            ],
          },
        ],
      },
    })
  })
})
