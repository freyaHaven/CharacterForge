# SRD 2024 Coverage Checklist

Authoritative audit of CharacterForge against **SRD 5.2.1** (`srd-2024` content pack,
manifest version `5.2.1`). Last audited against repository state with storage schema
**v14**.

This document evaluates **implementation depth**, not file presence alone. Each area is
scored across seven dimensions:

| Dimension | Meaning |
|-----------|---------|
| **Content** | Edition-specific definitions in `src/content/packs/srd-2024/` |
| **UI** | Wizard step, picker, or sheet surface for configuring the feature |
| **Persistence** | Saved on `Character`, migrated across schema versions |
| **Validation** | Rules enforce legal selections and block invalid saves/finish |
| **Derived** | Effects feed HP, AC, proficiencies, spell slots, inventory, etc. |
| **Sheet** | Overview / character-sheet presentation |
| **Tests** | Automated coverage (unit, integration, or workflow) |

### Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ Complete | End-to-end for current scope |
| 🟡 Partial | Some dimensions work; notable gaps remain |
| ❌ Missing | Not implemented |
| ⏸ Intentionally deferred | Explicitly postponed or stubbed |
| ➖ N/A | Not applicable to current edition scope |

---

## Summary

| Area | Overall | Notes |
|------|---------|-------|
| Species & ancestry | 🟡 | 9/9 SRD species bundled; several trait choices lack derived effects |
| Backgrounds | 🟡 | 4 bundled backgrounds; no custom background builder |
| Classes & subclasses | 🟡 | 7/12 SRD classes; 1 subclass each |
| Class feature choices | 🟡 | Most L1–20 choices work; Epic Boon and some subclass extras missing |
| Deferred class requirements | 🟡 | Starting equipment active; Epic Boon blocks finish at L19+ |
| Feats & acquisition | 🟡 | 4 origin feats; feat step hidden; no epic boons |
| Fighting styles | 🟡 | Fighter/Ranger/Paladin L1–2; Champion L7 second style missing |
| Weapon mastery | 🟡 | Slot schedules + UI; gear sub-choices deferred |
| Ability scores & ASIs | ✅ | All three methods + class ASI choices including feat option |
| Spell catalogue & lists | 🟡 | ~100 need-based spells; partial Druid/Wizard list stubs |
| Spellcasting | 🟡 | Cleric/Paladin/Ranger; no Pact Magic or spellbooks |
| Starting equipment | 🟡 | Package-vs-gold for all bundled classes/backgrounds |
| Full equipment catalogue | ⏸ | ~61 items for starting packages only |
| Inventory, currency, loadout | 🟡 | Resolved inventory + Overview loadout; no shop |
| Proficiencies & languages | 🟡 | Class/background on sheet; species/feat gaps |
| Derived combat stats | 🟡 | HP/AC strong; initiative/speed feat & lineage gaps |
| Multiclass | 🟡 | UI + validation + shared slots; no ability prerequisites |
| Higher-level creation | 🟡 | Levels 1–20 supported; L19 Epic Boon not pickable |
| Wizard visibility & routing | 🟡 | 10-step catalog; Details/Feats hidden; no URL routing |
| Import/export & migrations | ✅ | `.cforge` + localStorage v0→v14 |
| Overview & in-play management | 🟡 | Rich creation-time sheet; no rest/level-up/play mode |

---

## Detailed coverage

### Species and ancestry / lineage choices

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | 9 species in `species/index.ts` |
| UI | ✅ | `SpeciesStep` → `SpeciesPicker` with search and choices |
| Persistence | ✅ | `character.species`; schema v2+ |
| Validation | ✅ | `speciesRules.ts` |
| Derived | 🟡 | Darkvision, damage resistance, HP (Dwarf), languages wired; **Elf Keen Senses skill**, **Human Skillful / Versatile origin feat**, **Wood Elf +5 speed**, **lineage L3/L5 spells** not derived |
| Sheet | 🟡 | Species card on Overview; missing skill/speed/spell grants |
| Tests | ✅ | `speciesWorkflow`, `speciesRules`, per-species content tests |

**Gaps:** Human `skillful` and `versatile` traits are descriptive only (no choices).
Elf `keen-senses` choice has no `skill-proficiency` effect. Elven lineage higher-level
spells are text-only (no `spellEntitlements`).

---

### Backgrounds and custom backgrounds

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | 4 backgrounds: Acolyte, Criminal, Sage, Soldier |
| UI | ✅ | `BackgroundStep` → `BackgroundPicker` |
| Persistence | ✅ | `character.background`; schema v4+ |
| Validation | ✅ | `backgroundRules.ts` — ability scores, skills, tool, feat |
| Derived | ✅ | ASI bonuses, skills, origin feat, starting equipment entitlements |
| Sheet | ✅ | Background card + proficiencies on Overview |
| Tests | ✅ | `backgroundWorkflow`, `backgroundRules`, draft tests |

**Gaps:** No custom / build-your-own background flow. SRD includes additional
backgrounds beyond the bundled four. Soldier gaming-set choice is wired; other
tool-choice backgrounds N/A until more content ships.

---

### Classes and subclasses

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | **7/12** SRD classes; **1 subclass each** |
| UI | ✅ | `ClassStep` — single-class and multiclass workflows |
| Persistence | ✅ | `classes[]`, `targetLevel`, `startingClassInstanceId`; schema v9+ |
| Validation | ✅ | `validateCharacterClasses.ts`, `classRules.ts` |
| Derived | 🟡 | Class effects → proficiencies, spellcasting, HP dice |
| Sheet | ✅ | Class feature cards on Overview |
| Tests | ✅ | Per-class content + progression tests; `classWorkflow` |

**Bundled:** Fighter (Champion), Barbarian (Berserker), Rogue (Thief), Monk (Open Hand),
Ranger (Hunter), Paladin (Devotion), Cleric (Life Domain).

**Missing classes:** Bard, Druid, Sorcerer, Warlock, Wizard.

---

### Class feature choices

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | Skill proficiencies, subclasses, fighting styles, weapon mastery, ASIs, Divine Order, expertise, HP increases |
| UI | ✅ | `ClassProgressionSection`, `ClassMultiSelectChoiceField`, `AsiChoiceField` |
| Persistence | ✅ | `ClassInstance.choices`, `hitPointIncreases` |
| Validation | ✅ | `classRules.ts` including ASI encoding and weapon-mastery dedup |
| Derived | 🟡 | Most choice effects resolve; Champion L7 second fighting style is text-only |
| Sheet | ✅ | Feature accordion + choice summaries |
| Tests | ✅ | `classRules.test.ts`, per-class progression tests, `ClassPicker.test.tsx` |

---

### Deferred class requirements

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | `starting-equipment` (L1), `epic-boon-19` (L19) on all bundled classes |
| UI | 🟡 | `ClassDeferredRequirementsPanel` links to destination steps |
| Persistence | ➖ | Requirements are derived, not stored |
| Validation | 🟡 | Unresolved deferred reqs block finish (`characterFinishPolicy.ts`) |
| Derived | 🟡 | Starting equipment resolves to inventory; Epic Boon has no picker |
| Sheet | ✅ | Alerts on Overview when unresolved |
| Tests | ✅ | `deferredRequirements.test.ts`, progression tests assert L19 entry |

**Gap:** Characters at **level 19–20 cannot finish** until Epic Boon selection exists.

---

### Feats and feat acquisition

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | 4 origin feats: Alert, Magic Initiate (Cleric/Wizard), Savage Attacker |
| UI | 🟡 | `FeatPicker` exists; **Feats wizard step hidden** (`hasFeatChoices()` → false) |
| Persistence | ✅ | `character.feat`; schema v10+ |
| Validation | ✅ | `featRules.ts` |
| Derived | 🟡 | Magic Initiate spell entitlements resolve; Alert/Savage Attacker benefits display-only |
| Sheet | 🟡 | Origin feat card; no initiative bonus from Alert |
| Tests | 🟡 | `featRules.test.ts`, `FeatPicker.test.tsx`; no feat-step workflow tests |

**Acquisition paths today:** Background origin feat (auto-granted). Class ASI can pick a
feat from catalog via `AsiChoiceField`. No general feat step, no Epic Boon category
definitions, no fighting-style feat entries.

---

### Fighting styles

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | Styles as class choice effects, not standalone feat defs |
| UI | ✅ | Single-select on Class step (Fighter L1; Ranger/Paladin L2) |
| Persistence | ✅ | Encoded in class instance choices |
| Validation | ✅ | `classRules.ts` |
| Derived | 🟡 | `fighting-style` effect kind exists; **combat modifiers not applied** to AC/attacks |
| Sheet | 🟡 | Listed in class features; no mechanical AC/DPR impact |
| Tests | ✅ | Fighter/Paladin/Ranger content + `resolveClassEffects.test.ts` |

**Gap:** Champion **Additional Fighting Style** (L7) — feature text only.

---

### Weapon mastery

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Slot thresholds per class; 8 mastery properties; weapon→property map |
| UI | ✅ | Multi-select weapon choices on Class step |
| Persistence | ✅ | Class instance choices |
| Validation | ✅ | Cross-choice duplicate prevention in `classRules.ts` |
| Derived | 🟡 | Property labels on choices; **mastery properties not applied in combat** |
| Sheet | 🟡 | Shown in class feature summaries |
| Tests | ✅ | Per-class `*.weaponMastery.test.ts`, domain mastery tests |

**Deferred:** Fighter L1 “practice weapon drills” gear sub-choices (README roadmap item).

---

### Ability scores and ASIs

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Standard array, point buy (27), manual/rolled |
| UI | ✅ | `AbilityScoresStep` → `AbilityScoresForm` |
| Persistence | ✅ | `abilityScores`, `creationMethod`; background ASI in selections |
| Validation | ✅ | Method-specific rules + `canSaveCharacter` |
| Derived | ✅ | Modifiers feed skills, saves, spell DCs, HP (CON) |
| Sheet | ✅ | Ability cards with breakdown |
| Tests | ✅ | `standardArrayWorkflow`, `rolledWorkflow`, `abilityScoresWizard`, point-buy tests |

**ASI choices:** All bundled classes through L20; feat option at ASI levels via
`AsiChoiceField`. Epic Boon at L19 is **not** an ASI choice.

---

### Spell catalogue and class spell lists

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | **~100** spell definitions; lists for Cleric, Paladin, Ranger (+ Druid/Wizard stubs) |
| UI | ➖ | Catalogue consumed by Spells step and ASI feat picker |
| Persistence | ➖ | Definitions only |
| Validation | ➖ | — |
| Derived | ➖ | — |
| Sheet | ➖ | — |
| Tests | 🟡 | Spellcasting resolution tests; no full catalogue completeness test vs SRD |

**Scope:** Spells are included **on demand** (class lists, grants, Magic Initiate), not
as a full SRD spell compendium. Druid and Wizard lists cover cantrips + 1st level only
(stubs for Magic Initiate / Druidic Warrior).

---

### Spellcasting, Pact Magic, spellbooks, prepared/known spells

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | Full/half casters: Cleric, Paladin, Ranger; domain granted spells (Life) |
| UI | ✅ | `SpellsStep` → `SpellSelectionGrid` (conditional visibility) |
| Persistence | ✅ | `spellSourceStates`; schema v12+ |
| Validation | ✅ | `useSpellsStepValidation`, `spellSelectionEligibility` |
| Derived | 🟡 | Shared multiclass slots, prepared/known/cantrip kinds, granted spells |
| Sheet | ✅ | Spell groups on Overview when content exists |
| Tests | 🟡 | `resolveCharacterSpellcasting*.test.ts`, component tests; **no Spells-step wizard E2E** |

**Missing:** Pact Magic (Warlock), Wizard spellbook / prepared-from-book, Sorcerer
known-spells, Bard full caster, Druid full caster. Species lineage spells not wired.

**Note:** Spells step is **optional for finish** — incomplete spell picks do not block
Overview finish if required steps and deferred reqs are satisfied.

---

### Starting equipment

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | All 7 classes: Package A (+ Package B for Fighter) vs gold; 4 backgrounds: package vs 50 GP |
| UI | ✅ | `EquipmentStep` → `EquipmentSourceSection` |
| Persistence | ✅ | `equipment.selections`; schema v13+ |
| Validation | ✅ | Entitlement option validation |
| Derived | ✅ | `resolveCharacterEquipment` materializes inventory + GP |
| Sheet | 🟡 | Inventory appears on Overview after resolution |
| Tests | ✅ | `classStartingEquipment.test.ts`, `resolveCharacterEquipment.test.ts`, `EquipmentStep.test.tsx` |

**Gaps:** No multi-branch SRD equipment trees (e.g. Cleric weapon/armor sub-choices).
`choose-items` entitlements show “not available yet”. Monk `artisans-tools` is a generic
grant without sub-choice.

---

### Full equipment catalogue

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ⏸ | **~61 items** in `equipment/index.ts` — starting-package scope only |
| UI | ❌ | No browse/search compendium or shop |
| Persistence | ➖ | — |
| Validation | ➖ | — |
| Derived | 🟡 | Items used by resolver and loadout |
| Sheet | 🟡 | Owned items on Overview inventory |
| Tests | 🟡 | Materialization tests; no SRD-wide catalogue audit |

---

### Inventory, currency, containers, and loadout

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | Items, packs (`expandsTo`), containers, GP |
| UI | 🟡 | Equipment step = selections only; **loadout editing on Overview** (`InventoryPanel`) |
| Persistence | ✅ | `equipment.loadout`; schema v14 |
| Validation | ✅ | Equip conflicts via `previewEquipItem` |
| Derived | ✅ | Encumbrance (`STR × 15`), AC from equipped armor/shield |
| Sheet | ✅ | Tabs, search, weight/cost, equip/unequip |
| Tests | ✅ | `InventoryPanel`, `equipmentLoadout`, status warning tests |

**Gap:** `EquipmentLoadoutManager` exists but is test-only (not wired in wizard).

---

### Proficiencies, Expertise, skills, saves, and languages

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Class/background/species language definitions |
| UI | ✅ | Skill choices on Class step; languages via species |
| Persistence | ✅ | Class choices + background + species selections |
| Validation | ✅ | Skill choice counts enforced |
| Derived | 🟡 | Class + background skills on sheet; **species skills (Elf, Human) missing** |
| Sheet | 🟡 | Skills, saves, proficiencies panels on Overview |
| Tests | ✅ | `buildReviewSheetModels.test.ts` |

**Gaps:** Feat-granted proficiencies (Alert initiative prof.) not applied. Class tool
proficiencies beyond background tool line not surfaced.

---

### HP, AC, Initiative, speed, senses, and other derived statistics

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Hit dice, armor stats, species speed/darkvision |
| UI | 🟡 | HP choices on Class step; combat strip on Overview |
| Persistence | ✅ | HP increases on class instances |
| Validation | ✅ | HP choice validation per level |
| Derived | 🟡 | **HP ✅, AC ✅** (loadout-driven); **Initiative** = DEX only; **Speed** = base species speed |
| Sheet | ✅ | Combat stat summary on Overview |
| Tests | ✅ | `calculateCharacterHitPoints`, `calculateCharacterArmorClass`, `buildReviewSheetModels` |

**Gaps:** Alert (+proficiency to initiative) not applied. Wood Elf / Goliath speed bonuses
not computed. Passive scores use class/background skills only.

---

### Multiclass rules

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | All bundled classes support multiclass instances |
| UI | ✅ | Multiclass path, level allocation, starting class |
| Persistence | ✅ | `classes[]`, editor workflow in session storage |
| Validation | 🟡 | Duplicate class blocked; allocation vs `targetLevel`; **no ability score prerequisites** |
| Derived | ✅ | Shared spell slots, per-class HP, combined level for proficiency |
| Sheet | ✅ | Multi-class header and feature cards |
| Tests | ✅ | `ClassPicker.test.tsx`, `classWorkflow.test.tsx`, `validateCharacterClasses.test.ts` |

---

### Higher-level character creation

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | All bundled classes define features through L20 |
| UI | ✅ | Level stepper 1–20 (`LevelStepper`) |
| Persistence | ✅ | `targetLevel`, per-instance `level` |
| Validation | 🟡 | Level-gated choices work; **L19 Epic Boon blocks finish** |
| Derived | ✅ | Progression effects scale with level |
| Sheet | ✅ | Overview reflects target level |
| Tests | ✅ | Progression tests per class |

---

### Wizard step visibility and routing

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | 10 steps in `wizard/steps.ts` |
| UI | 🟡 | Nav shows visible steps only; **no URL/deep links** |
| Persistence | ✅ | `activeStepId` in editor session (sessionStorage) |
| Validation | ✅ | `getFirstIncompleteCharacterStep`, finish policy |
| Derived | ✅ | Open/import lands on first incomplete visible step |
| Sheet | ➖ | — |
| Tests | ✅ | `stepVisibility`, `navigation`, `firstIncompleteCharacterStep`, open-character hook tests |

| Step | Required | Visible by default |
|------|----------|-------------------|
| Basics | Yes | Yes |
| Class | Yes | Yes |
| Background | No | Yes |
| Species | Yes | Yes |
| Abilities | Yes | Yes |
| Equipment | No | Yes |
| Character Details | No | **Hidden** (`hasCharacterDetailsStep` → false) |
| Feats | No | **Hidden** (`hasFeatChoices` → false) |
| Spells | No | **When** `hasSpellContent` |
| Overview | No | Yes |

---

### Import, export, save, load, and schema migrations

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ➖ | — |
| UI | ✅ | Home + editor import; export download |
| Persistence | ✅ | localStorage `characterforge:character:{id}`; schema **v14** |
| Validation | ✅ | `parseStoredCharacter`, `isCharacter` |
| Derived | ➖ | — |
| Sheet | ➖ | — |
| Tests | ✅ | Per-migration tests (v0→v14), `characterFile.test.ts`, `appEntryFlow.test.tsx` |

**Migration chain:** v0→v14 in `adapters/storage/migrations/`. See
[`src/adapters/STORAGE.md`](../src/adapters/STORAGE.md) — note that file may lag the
code (documents through v11 at time of audit).

---

### Overview and in-play character management

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ➖ | — |
| UI | 🟡 | `ReviewStep` (Overview): sheet layout, inventory loadout, finish |
| Persistence | ✅ | Same character model; autosave on edit |
| Validation | ✅ | Finish policy, deferred requirement alerts |
| Derived | 🟡 | Full creation-time sheet; **no play-mode** (rests, HP tracking, spell slot spend, level-up after creation) |
| Sheet | 🟡 | Strong static sheet; not optimized for live session tracking |
| Tests | ✅ | `ReviewStep`, `reviewCharacterSheet`, `organizeReviewSheet` |

**In scope for “creation tool”:** export `.cforge`, reopen, edit any wizard step.
**Out of scope today:** encounter mode, resource tracking, post-creation leveling workflow.

---

## Roadmap

### 1. Required for a complete SRD 2024 character creator

- [ ] **Remaining 5 classes:** Bard, Druid, Sorcerer, Warlock, Wizard (with subclasses)
- [ ] **Epic Boon selection at level 19** — feat definitions + choice UI (currently blocks finish at L19–20)
- [ ] **Species mechanical gaps:** Human Skillful/Versatile, Elf Keen Senses skill, lineage speed/spells
- [ ] **Feat step visibility** — surface origin/ASI feat picks when entitlements exist
- [ ] **Character Details step** — enable nav or fold into Overview editing
- [ ] **Additional SRD backgrounds** beyond the bundled four
- [ ] **Multiclass ability score prerequisites**
- [ ] **Champion Additional Fighting Style** (L7)
- [ ] **Species lineage spell entitlements** (Elf, Gnome, Tiefling, etc.)
- [ ] **Magic Initiate / Alert / Savage Attacker derived mechanics** where rules affect sheet stats
- [ ] **Full class starting-equipment branch trees** where SRD offers nested choices
- [ ] **Expand spell catalogue** as new casters ship (full lists per class, not stubs)

### 2. Required for a usable character sheet during play

- [ ] **Apply feat modifiers** (Alert initiative proficiency, etc.)
- [ ] **Apply fighting style / weapon mastery** combat effects (or clearly mark as reference-only)
- [ ] **Correct speed** from species choices (Wood Elf, Goliath)
- [ ] **Spell slot tracking** — expended vs remaining, multiclass slot table on sheet
- [ ] **HP tracking** — current vs max, hit dice remaining
- [ ] **Rest workflow** — short/long rest resource recovery (class features, spell slots, HP)
- [ ] **Concentration / condition tracking** (minimal)
- [ ] **Print / PDF export** of Overview layout
- [ ] **Editable Overview** or quick-edit panels without walking full wizard

### 3. Optional SRD compendium or campaign-management features

- [ ] Full SRD equipment compendium and shop/purchase workflow
- [ ] Full SRD spell compendium browser
- [ ] Full SRD feat compendium (all origin, general, fighting styles, epic boons)
- [ ] Custom background builder
- [ ] Campaign roster / party management
- [ ] Cloud sync or shared character links
- [ ] Additional subclasses beyond one per class
- [ ] `srd-2014` content pack (species, classes, rules deltas)
- [ ] URL routing / deep links to characters and steps

### 4. Explicitly out of scope

- Non-SRD licensed book content (PHB-only options, setting-specific material)
- Automatic cross-edition character conversion
- Virtual tabletop integration
- Dice rolling / attack automation beyond ability generation
- DM tools (encounter building, initiative tracker for whole party)
- Rules engine for every situational SRD exception text

---

## Audit notes

**Method:** File inspection, test grep, and spot-checks of resolver and wizard paths.
Comments and README claims were verified against code.

**Counts verified in repo:** 9 species, 7 classes, 7 subclasses, 4 backgrounds, 4 feats,
~100 spells, ~61 equipment items, storage schema v14.

**Uncertain without manual SRD crosswalk:**

- Whether each starting-equipment package exactly matches SRD 5.2.1 item quantities and
  gold amounts (content tests cover bundled options but not literal SRD page parity).
- Complete spell list sizes for future full casters (current stubs are intentionally partial).
- Whether all class feature **text** on Overview matches SRD wording (mechanical resolution
  was the audit focus).

**Documentation lag:** `README.md` and `src/adapters/STORAGE.md` previously cited schema
v9/v11; code is at **v14** as of this audit.
