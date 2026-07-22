import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const circleOfTheLandSrd2024: SubclassDefinition = {
  id: 'srd-2024:circle-of-the-land',
  classId: 'srd-2024:druid',
  editionId: 'srd-2024',
  name: 'Circle of the Land',
  description:
    'The Circle of the Land comprises mystics and sages who safeguard ancient knowledge and rites. These Druids meet within sacred circles of trees or standing stones to whisper primal secrets in Druidic.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'circle-of-the-land',
  features: [
    {
      id: 'lands-aid',
      name: "Land's Aid",
      level: 3,
      description:
        "As a Magic action, you can expend a use of your Wild Shape and choose a point within 60 feet of yourself. Vitality-giving flowers and life-draining thorns appear for a moment in a 10-foot-radius Sphere centered on that point. Each creature of your choice in the Sphere must make a Constitution saving throw against your spell save DC, taking 2d6 Necrotic damage on a failed save or half as much damage on a successful one. One creature of your choice in that area regains 2d6 Hit Points. The damage and healing increase by 1d6 when you reach Druid levels 10 (3d6) and 14 (4d6).",
    },
    {
      id: 'natural-recovery',
      name: 'Natural Recovery',
      level: 6,
      description:
        "You can cast one of the level 1+ spells that you have prepared from your Circle Spells feature without expending a spell slot, and you must finish a Long Rest before you do so again.\nIn addition, when you finish a Short Rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your Druid level (round up), and none of them can be level 6+. Once you recover spell slots with this feature, you can't do so again until you finish a Long Rest.",
    },
    {
      id: 'natures-ward',
      name: "Nature's Ward",
      level: 10,
      description:
        "You are immune to the Poisoned condition, and you have Resistance to a damage type associated with your current land choice in the Circle Spells feature: Arid — Fire; Polar — Cold; Temperate — Lightning; Tropical — Poison.",
    },
    {
      id: 'natures-sanctuary',
      name: "Nature's Sanctuary",
      level: 14,
      description:
        "As a Magic action, you can expend a use of your Wild Shape and cause spectral trees and vines to appear in a 15-foot Cube on the ground within 120 feet of yourself. They last there for 1 minute or until you have the Incapacitated condition or die. You and your allies have Half Cover while in that area, and your allies gain the current Resistance of your Nature's Ward while there.\nAs a Bonus Action, you can move the Cube up to 60 feet to ground within 120 feet of yourself.",
    },
  ],
}
