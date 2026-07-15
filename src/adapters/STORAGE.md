# Storage format

## Current format (schema version 9)

Characters are persisted inside a versioned envelope:

```json
{
  "schemaVersion": 9,
  "character": { }
}
```

The inner character includes:

- `species: null | { speciesId, choices }`
- `targetLevel: number` — campaign / character target level (1–20)
- `classes: CharacterClassSelection[]` — zero or more class instances
- `startingClassInstanceId: null | string` — which instance grants starting
  proficiencies and equipment
- `background: null | { backgroundId, choices }`
- `details: CharacterDetails` — roleplay-facing identity and personality fields

Each `CharacterClassSelection` has:

- `instanceId` — stable identifier for UI state and deferred requirement ownership
- `classId`, `level`, `choices` — same shape as the legacy single-class selection

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

On load, schema 0–8 saves migrate forward to schema 9. Migration path:

- `species: null` (v1→v2)
- legacy `class: null` (v2→v3)
- `background: null` (v3→v4)
- background cleanup (v4→v6)
- `details` (v6→v8)
- replace legacy `class` with `targetLevel`, `classes[]`, and
  `startingClassInstanceId` (v8→v9)

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
  "schemaVersion": 9,
  "character": { }
}
```

Files use the `.cforge` extension, UTF-8 JSON, and pretty-printed formatting for
readability. Import parses the file, runs the migration pipeline above, validates
with `isCharacter()`, and loads the result into the editor. This path is separate
from browser local storage, which remains responsible for draft recovery between
refreshes during an active editor session.

## Saving

All saves are written in the current envelope format so the next load skips
migration when already up to date.
