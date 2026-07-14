# CharacterForge

A modern D&D 5e single-page character creator built with React, TypeScript, and
Vite. CharacterForge guides players through a seven-step wizard, validates
choices against edition-specific rules data, and persists characters to
localStorage with explicit schema versioning.

## Project goals

- Provide a clear, accessible character creation flow for D&D 5e (2014 and
  2024 SRD rules).
- Keep **domain**, **rules**, **adapters**, and **UI** separated so content and
  persistence can evolve independently.
- Store every mechanical value in **edition-specific definitions** with stable
  IDs (`srd-2024:fighter`, `srd-2024:dwarf`) rather than scattering edition
  conditionals through UI or generic rules code.
- Support save/reload, draft semantics, and forward-compatible storage
  migrations.

## Implemented features

### Wizard (7 steps)

| Step | Status |
|------|--------|
| Basics (name, rules edition) | Required — complete |
| Species | Required — catalogue, search, choices, edition change |
| Class | Required — Fighter vertical slice (2024 SRD) |
| Ability Scores | Required — manual, standard array, point buy, rolled |
| Background | Placeholder |
| Equipment | Placeholder |
| Review | Summary cards, finish policy |

### Rules content (bundled)

**SRD 2024**

- Species: Dwarf, Dragonborn
- Classes: Fighter (level 1 — fighting style, skill proficiencies, feature
  progression)

**SRD 2014**

- Catalogue slots reserved; no bundled species or classes yet. Edition-specific
  folder structure and IDs are ready for content without refactoring.

### Persistence

- Versioned localStorage envelope (`schemaVersion: 3`)
- Sequential migrations from legacy saves (v0 → v3)
- Draft blocking on save when species or class selections are incomplete

### UI

- Responsive species and class catalogue/detail layouts with live search
- Edition-change confirmation when incompatible species or class selections
  would be cleared
- Transparent PNG class icons (Fighter, Rogue, Artificer) with SVG fallback for
  unregistered classes

## Architecture overview

```
src/
  domain/          Types, ports, edition-safe schemas (Character, species, class)
  rules/           Validation and effect resolution from definitions + selections
  data/            Edition-specific content trees
    species/srd-2024/
    classes/srd-2024/
    content/       Shared SRD source metadata per edition
  adapters/        ClassCatalog, SpeciesCatalog, localStorage repository
  features/        React UI (pickers, drafts, icons)
  app/             Wizard shell, hooks, step status, save/finish policy
  assets/classes/  Class emblem PNGs (and future artwork)
```

**Data flow:** UI loads definitions from catalog ports → user selections are
held as drafts until validation passes → committed selections live on
`Character` → save writes the current schema envelope → load migrates and
validates.

**Edition safety:** `ClassDefinition` and `SpeciesDefinition` each carry
`editionId` and a full stable `id`. Validation compares selection IDs to the
resolved definition; changing edition prompts before clearing incompatible
selections.

See [`src/adapters/STORAGE.md`](src/adapters/STORAGE.md) for persistence
details.

## Development commands

```bash
npm install    # install dependencies
npm run dev      # start Vite dev server
npm run build    # typecheck and production build
npm test         # run Vitest suite
npm run lint     # Oxlint
npm run preview  # preview production build
```

## Storage schema version

**Current version: 3**

Envelope shape:

```json
{
  "schemaVersion": 3,
  "character": {
    "species": null,
    "class": null
  }
}
```

- **v0:** legacy root-level character JSON
- **v1:** versioned envelope without species
- **v2:** adds `species`
- **v3:** adds `class`

Migrations run on load in `src/adapters/storage/migrations/`.

## Supported editions and content

| Edition ID | Label | Species | Classes |
|------------|-------|---------|---------|
| `srd-2024` | D&D 5e 2024 | Dwarf, Dragonborn | Fighter |
| `srd-2014` | D&D 5e 2014 | (none bundled) | (none bundled) |

Mechanical text and choices come from SRD documents under CC-BY-4.0. See
[`src/data/species/attribution.md`](src/data/species/attribution.md) for species
source attribution.

## Asset attribution and licensing

### SRD rules text

Species and class **mechanics** are derived from Wizards of the Coast System
Reference Documents (SRD 5.2 for 2024 content, SRD 5.1 reserved for 2014).
Attribution and licence metadata live in `src/data/content/{edition}/source.ts`.

### Class icon PNGs

Original transparent PNG emblems in `src/assets/classes/`. Currently wired in
the app: **Fighter**, **Rogue**, **Artificer**. See
[`src/assets/classes/attribution.md`](src/assets/classes/attribution.md).

Icons are decorative; class names in the UI provide accessible labels.

### Other assets

- `src/assets/hero.png` — marketing/hero artwork
- Placeholder JPEG class artwork in `src/assets/classes/` is not yet used in
  the UI

## Roadmap

- **Class content:** Rogue and additional 2024 SRD classes; parallel
  `srd-2014` definitions where rules differ
- **Class icons:** Register remaining PNG emblems as artwork is finalized
- **Species:** 2014 SRD species in `src/data/species/srd-2014/`
- **Background step:** edition-specific background definitions and picker
- **Equipment step:** starting gear, weapon mastery choices (deferred from
  Fighter level-1 feature text)
- **Review polish:** richer summaries as more steps ship
- **Out of scope for now:** multiclassing, subclasses, automatic cross-edition
  conversion, non-SRD book content
