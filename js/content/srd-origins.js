/*
 * SRD 5.2 origins: species, backgrounds and origin feats.
 * Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, CC-BY-4.0.
 */
(function () {
  'use strict';
  var DRAGONS = [['black', 'Black', 'acid'], ['blue', 'Blue', 'lightning'], ['brass', 'Brass', 'fire'], ['bronze', 'Bronze', 'lightning'], ['copper', 'Copper', 'acid'],
    ['gold', 'Gold', 'fire'], ['green', 'Green', 'poison'], ['red', 'Red', 'fire'], ['silver', 'Silver', 'cold'], ['white', 'White', 'cold']];
  CF.content.extendPack('srd-5.2', {
    species: [
      {
        id: 'dragonborn', name: 'Dragonborn', size: 'Medium', speed: 30, senses: { darkvision: 60 },
        pitch: 'Proud dragon-blooded folk who breathe elemental energy.',
        lineageLabel: 'Draconic Ancestry',
        traits: [
          { name: 'Draconic Ancestry', text: 'Your lineage comes from a kind of dragon, which sets your Breath Weapon and damage resistance.' },
          { name: 'Breath Weapon', text: 'When you take the Attack action, you can replace one attack with an exhalation in a 15-ft Cone or 30-ft Line. Each creature there makes a DEX save; on a failure it takes 1d10 damage of your ancestry’s type, half on a success. Uses equal your proficiency bonus per Long Rest.' },
          { name: 'Damage Resistance', text: 'You have Resistance to the damage type of your Draconic Ancestry.' },
          { name: 'Darkvision', text: 'You have Darkvision with a range of 60 feet.' },
          { name: 'Draconic Flight', text: 'At character level 5, you can sprout spectral wings for 10 minutes once per Long Rest.' }
        ],
        breathWeapon: true,
        lineages: DRAGONS.map(function (d) {
          return { id: d[0], name: d[1] + ' Dragon', damageType: d[2], text: 'Breath Weapon and resistance: ' + d[2] + '.', defenses: [{ kind: 'resist', text: d[2] }] };
        })
      },
      {
        id: 'dwarf', name: 'Dwarf', size: 'Medium', speed: 30, senses: { darkvision: 120 },
        pitch: 'Tough, stubborn folk of stone and forge.',
        hpPerLevel: 1,
        defenses: [{ kind: 'resist', text: 'poison' }, { kind: 'advantage', text: 'saves vs. Poisoned' }],
        traits: [
          { name: 'Darkvision', text: 'You have Darkvision with a range of 120 feet.' },
          { name: 'Dwarven Resilience', text: 'You have Resistance to Poison damage and Advantage on saves to avoid or end the Poisoned condition.' },
          { name: 'Dwarven Toughness', text: 'Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.' },
          { name: 'Stonecunning', text: 'As a Bonus Action, gain Tremorsense with a range of 60 ft for 10 minutes while on or touching stone. Uses equal your proficiency bonus per Long Rest.' }
        ]
      },
      {
        id: 'elf', name: 'Elf', size: 'Medium', speed: 30, senses: { darkvision: 60 },
        pitch: 'Graceful, long-lived folk with a touch of the fey.',
        lineageLabel: 'Elven Lineage',
        defenses: [{ kind: 'immune', text: 'magical sleep' }, { kind: 'advantage', text: 'saves vs. Charmed' }],
        keenSenses: ['insight', 'perception', 'survival'],
        traits: [
          { name: 'Darkvision', text: 'You have Darkvision with a range of 60 feet.' },
          { name: 'Fey Ancestry', text: 'You have Advantage on saving throws you make to avoid or end the Charmed condition.' },
          { name: 'Keen Senses', text: 'You have proficiency in the Insight, Perception, or Survival skill.' },
          { name: 'Trance', text: 'You don’t need to sleep, and magic can’t put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.' }
        ],
        lineages: [
          { id: 'wood-elf', name: 'Wood Elf', speed: 35, cantrips: ['druidcraft'], text: 'Your Speed increases to 35 feet. You know the Druidcraft cantrip.' },
          { id: 'high-elf', name: 'High Elf', cantrips: ['prestidigitation'], text: 'You know the Prestidigitation cantrip.' },
          { id: 'drow', name: 'Drow', senses: { darkvision: 120 }, cantrips: ['dancing-lights'], text: 'Your Darkvision has a range of 120 feet. You know the Dancing Lights cantrip.' }
        ]
      },
      {
        id: 'gnome', name: 'Gnome', size: 'Small', speed: 30, senses: { darkvision: 60 },
        pitch: 'Small, curious inventors and tricksters.',
        lineageLabel: 'Gnomish Lineage',
        defenses: [{ kind: 'advantage', text: 'INT, WIS and CHA saves' }],
        traits: [
          { name: 'Darkvision', text: 'You have Darkvision with a range of 60 feet.' },
          { name: 'Gnomish Cunning', text: 'You have Advantage on INT, WIS and CHA saving throws.' }
        ],
        lineages: [
          { id: 'forest-gnome', name: 'Forest Gnome', cantrips: ['minor-illusion'], text: 'You know the Minor Illusion cantrip, and you always have Speak with Animals prepared; you can cast it without a slot a number of times equal to your proficiency bonus per Long Rest.' },
          { id: 'rock-gnome', name: 'Rock Gnome', cantrips: ['prestidigitation'], text: 'You know the Mending and Prestidigitation cantrips, and can build tiny clockwork devices.' }
        ]
      },
      {
        id: 'goliath', name: 'Goliath', size: 'Medium', speed: 35,
        pitch: 'Towering folk with the blood of giants.',
        lineageLabel: 'Giant Ancestry',
        traits: [
          { name: 'Giant Ancestry', text: 'You have a supernatural boon from your giant ancestors, usable a number of times equal to your proficiency bonus per Long Rest.' },
          { name: 'Large Form', text: 'At character level 5, you can become Large for 10 minutes once per Long Rest.' },
          { name: 'Powerful Build', text: 'You have Advantage on checks to end the Grappled condition, and you count as one size larger for carrying capacity.' }
        ],
        carryMultiplier: 2,
        lineages: [
          { id: 'cloud', name: 'Cloud’s Jaunt', text: 'As a Bonus Action, teleport up to 30 ft to an unoccupied space you can see.' },
          { id: 'fire', name: 'Fire’s Burn', text: 'When you hit with an attack roll and deal damage, deal an extra 1d10 Fire damage.' },
          { id: 'frost', name: 'Frost’s Chill', text: 'When you hit with an attack roll and deal damage, deal an extra 1d6 Cold damage and reduce the target’s Speed by 10 ft.' },
          { id: 'hill', name: 'Hill’s Tumble', text: 'When you hit a Large or smaller creature and deal damage, you can give it the Prone condition.' },
          { id: 'stone', name: 'Stone’s Endurance', text: 'When you take damage, use your Reaction to roll 1d12 + CON modifier and reduce the damage by that total.' },
          { id: 'storm', name: 'Storm’s Thunder', text: 'When a creature within 60 ft damages you, use your Reaction to deal 1d8 Thunder damage to it.' }
        ]
      },
      {
        id: 'halfling', name: 'Halfling', size: 'Small', speed: 30,
        pitch: 'Small, cheerful folk with uncanny luck.',
        defenses: [{ kind: 'advantage', text: 'saves vs. Frightened' }],
        traits: [
          { name: 'Brave', text: 'You have Advantage on saving throws you make to avoid or end the Frightened condition.' },
          { name: 'Halfling Nimbleness', text: 'You can move through the space of any creature that is a size larger than you, but you can’t stop there.' },
          { name: 'Luck', text: 'When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.' },
          { name: 'Naturally Stealthy', text: 'You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.' }
        ]
      },
      {
        id: 'human', name: 'Human', size: 'Medium', speed: 30,
        pitch: 'Adaptable and ambitious, found everywhere.',
        skillful: true, versatile: true,
        traits: [
          { name: 'Resourceful', text: 'You gain Heroic Inspiration whenever you finish a Long Rest.' },
          { name: 'Skillful', text: 'You gain proficiency in one skill of your choice.' },
          { name: 'Versatile', text: 'You gain an Origin feat of your choice.' }
        ]
      },
      {
        id: 'orc', name: 'Orc', size: 'Medium', speed: 30, senses: { darkvision: 120 },
        pitch: 'Strong, enduring folk who refuse to fall.',
        traits: [
          { name: 'Adrenaline Rush', text: 'You can take the Dash action as a Bonus Action. When you do, you gain Temporary HP equal to your proficiency bonus. Uses equal your proficiency bonus per Short or Long Rest.' },
          { name: 'Darkvision', text: 'You have Darkvision with a range of 120 feet.' },
          { name: 'Relentless Endurance', text: 'When you are reduced to 0 HP but not killed outright, you can drop to 1 HP instead. Once per Long Rest.' }
        ]
      },
      {
        id: 'tiefling', name: 'Tiefling', size: 'Medium', speed: 30, senses: { darkvision: 60 },
        pitch: 'Touched by the Lower Planes, with a spark of fiendish magic.',
        lineageLabel: 'Fiendish Legacy',
        traits: [
          { name: 'Darkvision', text: 'You have Darkvision with a range of 60 feet.' },
          { name: 'Fiendish Legacy', text: 'Your legacy grants a resistance and a cantrip (more spells at levels 3 and 5).' },
          { name: 'Otherworldly Presence', text: 'You know the Thaumaturgy cantrip.' }
        ],
        cantrips: ['thaumaturgy'],
        lineages: [
          { id: 'abyssal', name: 'Abyssal', cantrips: ['poison-spray'], defenses: [{ kind: 'resist', text: 'poison' }], text: 'Resistance to Poison damage. You know the Poison Spray cantrip.' },
          { id: 'chthonic', name: 'Chthonic', cantrips: ['chill-touch'], defenses: [{ kind: 'resist', text: 'necrotic' }], text: 'Resistance to Necrotic damage. You know the Chill Touch cantrip.' },
          { id: 'infernal', name: 'Infernal', cantrips: ['fire-bolt'], defenses: [{ kind: 'resist', text: 'fire' }], text: 'Resistance to Fire damage. You know the Fire Bolt cantrip.' }
        ]
      }
    ],

    backgrounds: [
      {
        id: 'acolyte', name: 'Acolyte', pitch: 'You served in a temple, learning sacred rites.',
        personality: { traits: ["I quote prayers in everyday conversation.", "I see the hand of my god in every coincidence.", "I keep a small shrine wherever I sleep.", "I’m patient with everyone, even the rude.", "I find comfort in ritual and routine.", "I’m always ready to listen to someone’s troubles."], ideals: ["Faith. My god guides every step I take. (Lawful)", "Charity. I help those in need, whoever they are. (Good)", "Tradition. The old rites must be kept alive. (Lawful)", "Change. Faith should grow with the world. (Chaotic)", "Power. Divine favor is a tool to use. (Evil)", "Seeking. I still have questions about the divine. (Neutral)"], bonds: ["My temple raised me, and I’d give my life for it.", "The priest who taught me is my dearest friend.", "I carry a holy relic I’m sworn to protect.", "I seek a lost scripture of my faith.", "A pilgrim I helped once is now in danger.", "I owe my life to an act of divine mercy."], flaws: ["I judge those who don’t share my faith.", "I trust my temple’s leaders too much.", "I’m rigid about rules and rituals.", "I hide doubts I’m ashamed of.", "I see sin everywhere.", "I can be naive about the world outside the temple."] },
        description: 'You devoted yourself to service in a temple, either nestled in a town or secluded in a sacred grove. There you performed rites in honor of a god or pantheon. You served under a priest and studied religion. Thanks to your priest’s instruction and your own devotion, you also learned how to channel a modicum of divine power in service to your place of worship and the people who prayed there.',
        abilityOptions: ['int', 'wis', 'cha'], feat: 'magic-initiate', featList: 'cleric',
        skills: ['insight', 'religion'], tool: { fixed: 'calligraphers-supplies' },
        equipment: { A: { items: [['calligraphers-supplies', 1], ['book', 1], ['holy-symbol', 1], ['parchment', 10], ['robe', 1]], gp: 8, text: 'Calligrapher’s Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP' }, B: { items: [], gp: 50, text: '50 GP' } }
      },
      {
        id: 'criminal', name: 'Criminal', pitch: 'You made a living in back alleys, pockets and shadows.',
        personality: { traits: ["I always have an escape plan.", "I count the coins in every purse I see.", "I’m calm when things get dangerous.", "I talk my way out of trouble.", "I keep my real name to myself.", "I can’t resist a challenge."], ideals: ["Freedom. Chains and rules aren’t for me. (Chaotic)", "Loyalty. I never betray my crew. (Lawful)", "Greed. I take what I can get. (Evil)", "Fairness. I only steal from those who can afford it. (Good)", "Survival. A person has to eat. (Neutral)", "Redemption. I want to leave my old life behind. (Good)"], bonds: ["My old gang is my family.", "Someone I trusted betrayed me to the guards.", "I owe money to a dangerous crime boss.", "I keep stolen goods hidden for a rainy day.", "A sibling still runs with my old crew.", "A victim I robbed showed me kindness."], flaws: ["I can’t resist taking something shiny.", "I lie even when I don’t need to.", "I don’t trust authority.", "I flee when things get bad.", "I hold grudges.", "I spend money as fast as I steal it."] },
        description: 'You eked out a living in dark alleyways, cutting purses or burgling shops. Perhaps you were part of a small gang of like-minded wrongdoers who looked out for each other. Or maybe you were a lone wolf, fending for yourself against the local thieves’ guild and more fearsome lawbreakers.',
        abilityOptions: ['dex', 'con', 'int'], feat: 'alert',
        skills: ['sleight-of-hand', 'stealth'], tool: { fixed: 'thieves-tools' },
        equipment: { A: { items: [['dagger', 2], ['thieves-tools', 1], ['crowbar', 1], ['pouch', 2], ['travelers-clothes', 1]], gp: 16, text: '2 Daggers, Thieves’ Tools, Crowbar, 2 Pouches, Traveler’s Clothes, 16 GP' }, B: { items: [], gp: 50, text: '50 GP' } }
      },
      {
        id: 'sage', name: 'Sage', pitch: 'You spent years studying in libraries and academies.',
        personality: { traits: ["I use long words to sound clever.", "I’ve read every book in the library, twice.", "I take notes on everything.", "I get lost in thought easily.", "I love answering questions.", "I’m awkward in social situations."], ideals: ["Knowledge. The path to power is understanding. (Neutral)", "Truth. Facts above all. (Lawful)", "Teaching. Knowledge must be shared. (Good)", "Curiosity. I need to know everything. (Chaotic)", "Mastery. I will become the greatest scholar. (Neutral)", "Secrets. Some knowledge is for me alone. (Evil)"], bonds: ["My library is my sanctuary.", "I’m searching for an answer to a great question.", "My mentor’s notes are my greatest treasure.", "A rival scholar stole my research.", "I protect a dangerous book.", "I owe my education to a patron."], flaws: ["I’m arrogant about what I know.", "I ignore danger when studying.", "I’m easily distracted.", "I can’t admit I’m wrong.", "I care more about books than people.", "I lecture people constantly."] },
        description: 'You spent your formative years traveling between manors and monasteries, performing various odd jobs and services in exchange for access to their libraries. You whiled away many a long evening studying books and scrolls, learning the lore of the multiverse—even the rudiments of magic—and your mind yearns for more.',
        abilityOptions: ['con', 'int', 'wis'], feat: 'magic-initiate', featList: 'wizard',
        skills: ['arcana', 'history'], tool: { fixed: 'calligraphers-supplies' },
        equipment: { A: { items: [['quarterstaff', 1], ['calligraphers-supplies', 1], ['book', 1], ['parchment', 8], ['robe', 1]], gp: 8, text: 'Quarterstaff, Calligrapher’s Supplies, Book (history), Parchment (8 sheets), Robe, 8 GP' }, B: { items: [], gp: 50, text: '50 GP' } }
      },
      {
        id: 'soldier', name: 'Soldier', pitch: 'You trained for war and fought on the battlefield.',
        personality: { traits: ["I salute my superiors out of habit.", "I keep my gear in perfect order.", "I tell war stories.", "I’m calm under pressure.", "I respect strength and discipline.", "I sleep lightly."], ideals: ["Duty. I follow orders. (Lawful)", "Protection. I fight for those who can’t. (Good)", "Glory. I want to be remembered. (Chaotic)", "Comrades. My unit is my family. (Lawful)", "Survival. Stay alive, whatever it takes. (Neutral)", "Strength. The strong rule. (Evil)"], bonds: ["My old unit is my family.", "I lost friends in battle.", "A commander saved my life.", "I fight for my homeland.", "I keep a token from a fallen comrade.", "An enemy I spared may still be out there."], flaws: ["I follow orders without question.", "I’m quick to violence.", "I’m haunted by the war.", "I distrust civilians.", "I drink too much.", "I can’t relax."] },
        description: 'You began training for war as soon as you reached adulthood and carry precious few memories of life before you took up arms. Battle is in your blood. Sometimes you catch yourself reflexively performing the basic fighting exercises you learned first. Eventually, you put that training to use on the battlefield, protecting the realm by waging war.',
        abilityOptions: ['str', 'dex', 'con'], feat: 'savage-attacker',
        skills: ['athletics', 'intimidation'], tool: { choose: 'gaming-set' },
        equipment: { A: { items: [['spear', 1], ['shortbow', 1], ['arrows', 20], ['dice-set', 1], ['healers-kit', 1], ['quiver', 1], ['travelers-clothes', 1]], gp: 14, text: 'Spear, Shortbow, 20 Arrows, Gaming Set (same as above), Healer’s Kit, Quiver, Traveler’s Clothes, 14 GP' }, B: { items: [], gp: 50, text: '50 GP' } }
      }
    ],

    feats: [
      { id: 'alert', name: 'Alert', category: 'origin', pitch: 'Always ready: add your proficiency bonus to initiative.',
        text: 'You add your proficiency bonus to Initiative rolls. Immediately after you roll Initiative, you can swap your Initiative with one willing ally in the same combat.' },
      { id: 'magic-initiate', name: 'Magic Initiate', category: 'origin', pitch: 'Learn two cantrips and one 1st-level spell.',
        text: 'Choose Cleric, Druid or Wizard. You learn two cantrips and one 1st-level spell from that list. You can cast the 1st-level spell once without a slot per Long Rest, and also with any spell slots you have. INT, WIS or CHA is your spellcasting ability for these spells (choose when you take the feat).' },
      { id: 'savage-attacker', name: 'Savage Attacker', category: 'origin', pitch: 'Roll weapon damage twice and keep the better.',
        text: 'Once per turn, when you hit a target with a weapon, you can roll the weapon’s damage dice twice and use either roll.' },
      { id: 'skilled', name: 'Skilled', category: 'origin', pitch: 'Gain three skill (or tool) proficiencies.',
        text: 'You gain proficiency in any combination of three skills or tools of your choice.' }
    ]
  });
})();
