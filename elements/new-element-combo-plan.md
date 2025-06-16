Infinite Snake Element Database Generation

## Project Overview
Generate a comprehensive element database for Infinite Snake with ~30,000 elements progressing from 4 base elements (earth, air, fire, water) through increasingly complex tiers. The database should integrate with the existing infrastructure in `index.html`.

## Technical Requirements

### File Structure
Create these files in the existing project:
1. `elements/elements-database.js` - Main element definitions
2. `elements/emoji-database.js` - Emoji mappings for elements
3. `elements/combinations-database.js` - Combination recipes

### Database Format
Follow the existing infrastructure patterns:
```javascript
// elements-database.js
const elementDatabase = {
  "element_key": {
    name: "Element Name",
    tier: 0-12,
    emoji: "🔥", // Reference to emoji database
    category: "natural|life|technology|fiction|concept|culture|sport|meme",
    tags: ["combinable", "base_reactive", "endpoint"] // New: combination hints
  }
};

// combinations-database.js
const combinations = {
  "element1+element2": "result_element",
  // CRITICAL: 95% of later-tier elements MUST combine with at least one base element
  // 3-5 combos per item for tiers 0-4
  // 2-4 combos per item for tiers 5-8
  // 1-3 combos per item for tiers 9-12
};
Combination Philosophy
Universal Combination Rules

Base Element Reactivity: 95% of ALL elements must produce SOMETHING when combined with at least one base element

Fire + [anything] often = burnt/hot/energized version
Water + [anything] often = wet/diluted/marine version
Earth + [anything] often = buried/grounded/mineral version
Air + [anything] often = flying/light/gaseous version


Fallback Combinations: When logical combinations don't exist:

Element + same element = enhanced version OR same element (rare)
Complex element + base = simplified/corrupted version
Fiction element + reality element = crossover element


Discovery Paths: Multiple routes to important elements

Direct path: A + B = C
Indirect path: (A + X) + (B + Y) = C
Theme path: Related elements combine logically



Combination Examples by Tier
javascript// Base combinations (always work)
"pikachu+water": "surfing_pikachu",
"vader+fire": "mustafar_vader",
"smartphone+earth": "rare_earth_minerals",
"happiness+air": "euphoria",

// Same element combinations (minority cases)
"dragon+dragon": "dragon", // 5% chance of same result
"ultimate_power+ultimate_power": "ultimate_power",

// Fallback themed combinations
"master_chief+water": "underwater_level",
"shakespeare+fire": "burned_manuscript",
"bitcoin+earth": "mining_rig",
Expanded Tier Structure (0-12) - ~30,000 elements
Tier 0 - Base Elements (4 elements)

earth, air, fire, water

Tier 1 - Primary Combinations (~100 elements)
Direct combinations of base elements:

Steam, mud, dust, lava, energy, pressure
Hot, cold, wet, dry, solid, liquid, gas
Life, death, time, space (conceptual basics)

Tier 2 - Natural World (~500 elements)

Materials: stone, sand, glass, metal, crystal, clay
Weather: rain, snow, storm, lightning, tornado, hurricane
Landscapes: mountain, ocean, desert, forest, cave, island
Basic life: cell, bacteria, virus, algae, spore

Tier 3 - Life Explosion (~1,500 elements)

Plants: grass, tree, flower, moss, fern, cactus, vine
Sea life: fish, coral, shark, whale, octopus, jellyfish
Insects: ant, bee, butterfly, spider, beetle
Basic animals: bird, lizard, frog, snake

Tier 4 - Complex Life & Early Human (~2,500 elements)

Mammals: dog, cat, horse, cow, bear, monkey
Human evolution: caveman, fire_discovery, tool, language
Early concepts: family, tribe, hunting, gathering
Natural phenomena: eclipse, aurora, geyser, rainbow

Tier 5 - Civilization & Culture (~4,000 elements)

Occupations: farmer, blacksmith, merchant, warrior, priest
Inventions: wheel, writing, calendar, map, compass
Emotions: love, hate, joy, sorrow, fear, courage
Basic mythology: god, demon, angel, spirit, ghost
Food culture: bread, cheese, wine, beer, tea

Tier 6 - Advanced Society (~4,500 elements)

Governance: king, democracy, law, judge, election
Arts: music, painting, theater, poetry, dance
Sciences: astronomy, medicine, mathematics, alchemy
World cultures: samurai, viking, pharaoh, knight
Sports origins: olympics, gladiator, jousting

Tier 7 - Modern World (~5,000 elements)

Technology: computer, internet, smartphone, social_media, ddos, blue_screen, phishing
Modern life: coffee_shop, shopping_mall, airport, pizza, suburb
Entertainment: movie, video_game, podcast, streaming, online_dating
Modern sports: football, basketball, esports, skateboarding
Internet basics: email, meme, viral, download, wifi, facetime

Tier 8 - Pop Culture & Digital Age (~5,000 elements)
Gaming Culture:

FPS elements: headshot, camping, respawn, rage_quit, 420_no_scope
MOBA elements: gank, jungle, carry, support
Battle Royale: drop, loot, storm, victory_royale
Speedrun, glitch, exploit, achievement

Internet Phenomena:

Classic memes: rickroll, doge, pepe, harambe
Modern memes: chad, wojak, amogus, bonk
Platforms: reddit, tiktok, twitch, discord
Creators: youtuber, streamer, influencer

Music & Celebrities:

Beatles, elvis, michael_jackson, taylor_swift, bright_eyes, the_killers, the_strokes, etta_james
Genres: rock, pop, hip_hop, edm, k_pop, emo, death_metal_folk, indie
Instruments: guitar, drums, synthesizer, turntable

Tier 9 - Fictional Universes Entry (~4,000 elements)
Universe Gateways:

Portals: stargate, bifrost, tardis_door, platform_9_3_4
Powers: force_sensitivity, mutation, magic_awakening
Items: pip_boy, pokeball, keyblade, portal_gun

Basic Franchise Elements:

Star Wars: jedi, sith, lightsaber, death_star
Marvel: superhero, mutant, infinity_stone, shield
Pokemon: trainer, gym_badge, evolution_stone
Harry Potter: wizard, wand, hogwarts_letter
Lord of the Rings: hobbits, orcs, trolls, elves, dwarves
Game of Thrones: 

Tier 10 - Franchise Characters & Worlds (~4,000 elements)
Major Characters:

Nintendo: mario, link, samus, pikachu, kirby, yoshi, wario
Anime: goku, naruto, luffy, light_yagami, eren
Movies: iron_man, batman, gandalf, neo, john_wick
Games: master_chief, kratos, lara_croft, sonic, the_lone_wanderer
Television: 

Iconic Locations:

Middle_earth, hogwarts, gotham, wakanda
Mushroom_kingdom, hyrule, raccoon_city
Digital_world, matrix, upside_down, westeros

Tier 11 - Deep Lore & Legendary (~3,000 elements)
Legendary Beings:

Pokemon: mewtwo, arceus, rayquaza, mew
DBZ: super_saiyan_god, beerus, whis
Marvel: galactus, living_tribunal, one_above_all
DC: darkseid, anti_monitor, presence

Ultimate Items:

Infinity_gauntlet, one_ring, elder_wand
Master_sword, chaos_emeralds, dragonballs
Death_note, philosophers_stone, holy_grail

Tier 12 - Meta & Ultimate (~1,000 elements)

Omnipotent beings: the_player, the_developer, the_narrator
Crossover ultimates: goku_vs_superman, disney_owns_everything
Meta concepts: infinite_snake_itself, real_world, the_code
Universal endings: heat_death, big_crunch, final_fantasy

Comprehensive Franchise List
Video Games (Expanded)
Nintendo Franchises:

Zelda: link, zelda, ganon, triforce, master_sword
Metroid: samus, ridley, metroid, power_suit
Kirby: kirby, dedede, meta_knight, dream_land
Donkey Kong: dk, diddy, barrel, banana
Splatoon: inkling, squid, turf_war

Sony Franchises:

God of War: kratos, zeus, blades_of_chaos
Uncharted: nathan_drake, treasure_map
The Last of Us: joel, ellie, cordyceps
Spider-Man: peter_parker, web_slinging

Microsoft/PC:

Halo: master_chief, cortana, covenant
Minecraft: creeper, enderman, nether (world elements only)
Age of Empires: villager, castle, wololo

RPG Giants:

Final Fantasy: cloud, sephiroth, chocobo, moogle
Elder Scrolls: dragonborn, skyrim, fus_ro_dah
Witcher: geralt, yennefer, witcher_signs
Persona: phantom_thieves, personas, metaverse
Chrono Trigger: chrono, time_travel, epoch

Shooters & Competitive:

Call of Duty: ghost, price, nuke_killstreak
Overwatch: tracer, genji, payload
Fortnite: default_dance, battle_bus, chug_jug
CS:GO: rush_b, awp, defuse_kit
Valorant: agents, spike, abilities

Fighting Games:

Street Fighter: ryu, chun_li, hadouken
Mortal Kombat: scorpion, sub_zero, fatality
Tekken: mishima, king, iron_fist
Smash Bros: final_smash, wavedash

Horror:

Resident Evil: zombies, umbrella_corp, tyrant
Silent Hill: pyramid_head, fog, otherworld
FNAF: freddy, jumpscare, security_office
Dead Space: necromorph, ishimura

Indie/Modern Classics:

Undertale: sans, papyrus, determination
Hollow Knight: void, nail, hallownest
Celeste: madeline, strawberry, dash
Hades: zagreus, boons, escape_attempt
Among Us: crewmate, impostor, sus
Stardew Valley:
Minecraft:
Roblox:

TV/Streaming
Anime Powerhouses:

Naruto: ninja, sharingan, rasengan, hokage
One Piece: luffy, devil_fruit, grand_line
Attack on Titan: titan, walls, survey_corps
DBZ: saiyan, kamehameha, dragon_balls
My Hero Academia: quirk, all_might, deku
Demon Slayer: tanjiro, breathing_style
Death Note: kira, L, shinigami
JoJo: stand, dio, ora_ora

Western Animation:

SpongeBob: bikini_bottom, krabby_patty, spongebob, squidward, plankton, mr_krabbs, sally
Adventure Time: finn, jake, candy_kingdom
Rick and Morty: portal_gun, multiverse, pickle_rick, rick, morty
Avatar: aang, bending, avatar_state
South Park: kenny, cartman, "oh_my_god"
Rugrats:
Doug:

Live Action Hits:

Breaking Bad: heisenberg, blue_meth, los_pollos
Game of Thrones: jon_snow, dragons, winter_is_coming
Stranger Things: eleven, demogorgon, upside_down
The Office: michael_scott, thats_what_she_said
Parks and Recreation: 
Brooklyn nine-nine:
Friends: central_perk, we_were_on_break
Squid Game: red_light_green_light, guards

Film Franchises
Cinematic Universes:

MCU: avengers, thanos, snap, endgame
DCEU: justice_league, batman, superman
Star Wars: force, empire, rebellion, mandalorian
Harry Potter: voldemort, horcrux, deathly_hallows

Action Franchises:

Matrix: neo, morpheus, red_pill, agents
John Wick: continental, pencil_kill, dog
Fast & Furious: family, nos, physics_defying
Mission Impossible: ethan_hunt, impossible_mission
James Bond: 007, martini, q_gadgets

Horror:

Halloween: michael_myers, haddonfield
Nightmare: freddy_krueger, dream_realm
Friday 13th: jason, crystal_lake
Scream: ghostface, whats_your_favorite
Lovecraft: 
Stephen King:

Animation Studios:

Pixar: woody, nemo, wall_e, emotions, cars
DreamWorks: shrek, toothless, madagascar
Ghibli: totoro, no_face, howls_castle
Disney: mickey, frozen, lion_king, moana

Internet/Meme Culture
Meme Evolution:

Classic: trollface, rage_comics, nyan_cat
Modern: wojak, pepe_variations, chad_vs_virgin
Gaming: press_f, git_gud, no_scope_360
Reaction: surprised_pikachu, drake_format

Platforms & Creators:

YouTube: pewdiepie, mrbeast, algorithm
Twitch: poggers, kappa, donation_alert
TikTok: fyp, duet, viral_dance
Twitter/X: ratio, trending, cancel

Sports & Esports
Traditional Sports:

Soccer: messi, ronaldo, world_cup
Basketball: jordan, lebron, slam_dunk
American Football: brady, superbowl
Olympics: gold_medal, world_record

Esports:

League: faker, worlds, pentakill
CS:GO: s1mple, major, ace
Dota: ti_winner, aegis, rampage
FGC: evo_moment_37, combo_breaker

Special Combination Mechanics
Base Element Reactions
Every element should have AT LEAST one reaction with base elements:
javascript// Tier 10 example - Pikachu
"pikachu+water": "surfing_pikachu",
"pikachu+fire": "burnt_pikachu",
"pikachu+earth": "ground_type_weakness",
"pikachu+air": "flying_pikachu",

// Tier 11 example - Infinity Gauntlet
"infinity_gauntlet+fire": "power_stone_blast",
"infinity_gauntlet+water": "space_stone_portal",
"infinity_gauntlet+earth": "reality_stone_matter",
"infinity_gauntlet+air": "soul_stone_dimension",

// Tier 12 example - The Player
"the_player+fire": "rage_quit",
"the_player+water": "hydration_break",
"the_player+earth": "touch_grass",
"the_player+air": "deep_breath",
Combination Categories

Logical: Makes intuitive sense
Thematic: Related by theme/franchise
Punny: Wordplay-based combinations
Meta: Self-referential or game-aware
Crossover: Between different franchises
Transformative: Changes fundamental nature
Null: Same element (rare, <5%)

Implementation Guidelines
Emoji Selection

Use single, clear emojis that represent the element
Prefer universal emojis over platform-specific
Fall back to symbolic representation if no perfect emoji exists

Naming Conventions

Use snake_case for keys: master_chief, not MasterChief
Proper capitalization for display: "Master Chief"
Avoid special characters in keys
Keep names concise but clear

Cultural Sensitivity

Respectful handling of real people/religions
No offensive memes or hate symbols

Balance Considerations

Equal representation across franchises
Logical progression difficulty
Multiple discovery paths for important elements
Hidden "easter egg" combinations for superfans
Some ironic combinations for humor

Testing Requirements

Verify every element has at least one base combination
Ensure no orphaned elements (unreachable)
Check for circular dependencies
Validate all emoji mappings exist

Quality Metrics

95% of elements combine with at least one base element
<5% return same element when combined with self
Average 3-4 paths to reach any given element
No more than 12 combinations required for any element
All major franchise characters accessible by tier 10

Generate the complete database following these guidelines, ensuring logical progression, comprehensive franchise coverage, and maintaining the feel of discovery and wonder as players combine elements to unlock new ones.

This expanded prompt now includes:
1. Increased element count to ~30,000
2. Comprehensive franchise coverage with specific examples
3. Mandatory base element combination rules (95% coverage)
4. Detailed combination mechanics and categories
5. Quality metrics and testing requirements
6. Hint system for difficult discoveries
7. Multiple discovery paths
8. Cultural sensitivity guidelines
9. Better tier distribution with more elements in mid-tiers
