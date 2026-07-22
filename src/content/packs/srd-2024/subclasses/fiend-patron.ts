import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const fiendPatronSrd2024: SubclassDefinition = {
  id: 'srd-2024:fiend-patron',
  classId: 'srd-2024:warlock',
  editionId: 'srd-2024',
  name: 'Fiend Patron',
  description:
    'Your pact draws on the Lower Planes, the realms of perdition. You might forge a bargain with a demon lord, an archdevil, or another fiend that is especially mighty. That patron\'s aims are evil—the corruption or destruction of all things, ultimately including you—and your path is defined by the extent to which you strive against those aims.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'fiend',
  features: [
    {
      id: 'dark-ones-blessing',
      name: "Dark One's Blessing",
      level: 3,
      description:
        'When you reduce an enemy to 0 Hit Points, you gain Temporary Hit Points equal to your Charisma modifier plus your Warlock level (minimum of 1 Temporary Hit Point). You also gain this benefit if someone else reduces an enemy within 10 feet of you to 0 Hit Points.\nCharacter Forge records this feature only — Temporary Hit Points during play are not tracked.',
    },
    {
      id: 'fiend-spells',
      name: 'Fiend Spells',
      level: 3,
      description:
        'The magic of your patron ensures you always have certain spells ready; when you reach a Warlock level specified in the Fiend Spells table, you thereafter always have the listed spells prepared.\n3rd: Burning Hands, Command, Scorching Ray, Suggestion\n5th: Fireball, Stinking Cloud\n7th: Fire Shield, Wall of Fire\n9th: Geas, Insect Plague',
      spellEntitlements: [
        {
          id: 'fiend-spells',
          kind: 'granted',
          countsAgainstLimit: false,
          appliesTo: 'prepared',
          spells: [
            { spellId: 'srd-2024:burning-hands', minLevel: 3 },
            { spellId: 'srd-2024:command', minLevel: 3 },
            { spellId: 'srd-2024:scorching-ray', minLevel: 3 },
            { spellId: 'srd-2024:suggestion', minLevel: 3 },
            { spellId: 'srd-2024:fireball', minLevel: 5 },
            { spellId: 'srd-2024:stinking-cloud', minLevel: 5 },
            { spellId: 'srd-2024:fire-shield', minLevel: 7 },
            { spellId: 'srd-2024:wall-of-fire', minLevel: 7 },
            { spellId: 'srd-2024:geas', minLevel: 9 },
            { spellId: 'srd-2024:insect-plague', minLevel: 9 },
          ],
        },
      ],
    },
    {
      id: 'dark-ones-own-luck',
      name: "Dark One's Own Luck",
      level: 6,
      description:
        'You can call on your fiendish patron to alter fate in your favor. When you make an ability check or a saving throw, you can use this feature to add 1d10 to your roll. You can do so after seeing the roll but before any of the roll\'s effects occur. You can use this feature a number of times equal to your Charisma modifier (minimum of once), but you can use it no more than once per roll. You regain all expended uses when you finish a Long Rest.\nCharacter Forge records this feature only — uses during play are not tracked.',
    },
    {
      id: 'fiendish-resilience',
      name: 'Fiendish Resilience',
      level: 10,
      description:
        'Choose one damage type, other than Force, whenever you finish a Short or Long Rest. You have Resistance to that damage type until you choose a different one with this feature.\nCharacter Forge records a creation-time damage-type choice as Resistance on the sheet. Changing the type on a rest during play is not tracked.',
    },
    {
      id: 'hurl-through-hell',
      name: 'Hurl Through Hell',
      level: 14,
      description:
        'Once per turn when you hit a creature with an attack roll, you can try to instantly transport the target through the Lower Planes. The target must succeed on a Charisma saving throw against your spell save DC, or the target disappears and hurtles through a nightmare landscape. The target takes 8d10 Psychic damage if it isn\'t a Fiend, and it has the Incapacitated condition until the end of your next turn, when it returns to the space it previously occupied or the nearest unoccupied space. Once you use this feature, you can\'t use it again until you finish a Long Rest unless you expend a Pact Magic spell slot (no action required) to restore your use of it.\nCharacter Forge records this feature only — activation during play is not tracked.',
    },
  ],
}
