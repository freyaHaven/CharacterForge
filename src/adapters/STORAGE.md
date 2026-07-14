# Storage format (future)

## Current prototype

Characters are persisted as a raw `Character` JSON object with no schema version.
Adding required fields causes older saves to fail `isCharacter()` and load as `null`.

## Required before real character data

Wrap persisted data in a versioned envelope:

```json
{
  "schemaVersion": 1,
  "character": { }
}
```

Future adapters must:

1. Read the envelope and branch on `schemaVersion`.
2. Migrate older shapes into the current `Character` model.
3. Never silently treat unmigrated saves as missing characters.

Migrations belong in `src/adapters/`, not in domain or UI.
