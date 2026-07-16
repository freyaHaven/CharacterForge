# Class icon assets

Class artwork lives in two sets under `src/assets/classes/`:

- `icon/` — compact glyphs for Class selection cards, headers, summaries, pills, review, and navigation
- `insignia/` — crests for the detailed Class Overview panel

Race artwork lives in `src/assets/races/` (SVG preferred).

All lookups go through `src/assets/iconRegistry.ts` (`getRaceIcon`,
`getClassIcon`, `getClassInsignia`). Do not import asset files from feature
components.

Filename quirks preserved intentionally (do not rename assets):

- `artificier` (icon + insignia) maps from the `artificer` class id
- `archer` (icon + insignia) maps from `ranger` / `hunter` ids
- `half_elf` / `half_orc` race files map from hyphenated species suffixes

Legacy emblem PNGs/JPEGs in `src/assets/classes/` (outside `icon/` and
`insignia/`) are retained for reference and are not wired into the UI.

## Accessibility

Icons next to visible class or species names are decorative: empty `alt` and
`aria-hidden`. Pass an `alt` prop to `SpeciesIcon` / `ClassIcon` /
`ClassInsignia` when the image is the primary label.
