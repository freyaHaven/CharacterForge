# Storage format

## Current format (schema version 16)

Characters are persisted inside a versioned envelope:

```json
{
  "schemaVersion": 16,
  "character": { }
}
```

The inner character includes:

- `species: null | { speciesId, choices }`
- `targetLevel: number` — campaign / character target level (1–20)
- `classes: CharacterClassSelection[]` — zero or more class instances
- `startingClassInstanceId: null | string` — which instance grants starting
  proficiencies and equipment
- `background: null | { backgroundId, abilityScoreIncrease, choices }`
- `feat: null | { featId, choices }` — one optional committed feat selection
- `details: CharacterDetails` — roleplay-facing identity and personality fields
- `spellSourceStates` — persisted spell source selections
- `equipment` — starting-equipment `selections`, worn `loadout`, and persisted
  gameplay `inventory` (entries, currency, `seededFromStartingEquipment`)

Each `CharacterClassSelection` has:

- `instanceId` — stable identifier for UI state and deferred requirement ownership
- `classId`, `level`, `choices` — same shape as the legacy single-class selection
- `hitPointIncreases` — per-class-level Fixed / Roll / Max choices for HP

The localStorage adapter reads stored JSON, migrates legacy shapes, validates
the inner character with `isCharacter()`, and returns the domain model.

## Legacy formats

| Version | Shape |
|---------|-------|
| 0 | Raw character JSON at the root (no `schemaVersion`) |
| 1 | `{ schemaVersion: 1, character }` without species or class fields |
| 2 | `{ schemaVersion: 2, character }` with `species` |
| 3 | `{ schemaVersion: 3, character }` with legacy `class: null \| { classId, level, choices }` |
| 4 | Adds `background: null` (still uses legacy `class`) |
| 5 | Strips derived background ability-score bonuses |
| 6 | Strips background equipment choices moved to the Equipment step |
| 7 | Adds `details` |
| 8 | Restructures `details` for the roleplay-focused layout |
| 9 | Replaces legacy `class` with `targetLevel`, `classes[]`, and `startingClassInstanceId` |
| 10 | Adds `feat: null` |
| 11 | Class instances include `hitPointIncreases` |
| 12 | Persisted `spellSourceStates` |
| 13 | Persisted `equipment.selections` |
| 14 | Persisted `equipment.loadout` |
| 15 | Normalize equipment selection `path` |
| 16 | Persisted `equipment.inventory` (entries, currency, seed flag) |

On load, schema 0–15 saves migrate forward to schema 16. Migration path includes
the historical steps above; equipment inventory is added empty at v15→v16 and
seeded lazily once starting equipment is complete in the editor.

## Migration rules

1. Detect the stored schema version (`0` for legacy root objects).
2. Reject saves with a schema version newer than the app supports.
3. Run sequential migrations in `src/adapters/storage/migrations/`.
4. Validate the migrated character with `isCharacter()`.
5. Never silently treat unmigrated saves as missing characters.

Migration logic belongs in `src/adapters/storage/`, not in domain or UI code.

## Character Forge files (`.cforge`)

Explicit import/export uses the same versioned envelope as local storage:

```json
{
  "schemaVersion": 16,
  "character": { }
}
```

Imported files migrate through the same registry as localStorage saves.
