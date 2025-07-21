// Lore data for the game - accessible from both lore.html and the main game
window.LORE_DATA = {
    'fold-1': {
        id: 'fold-1',
        number: '001',
        title: 'The Fold',
        category: 'beginning',
        content: `Before separation, there was unity. Not the unity of harmony, but the unity of things that have not yet learned they are different.
        
        The Fold existed outside of sequence, outside of causality. All elements occupied the same conceptual space without intersection or reaction. Fire contained no heat because heat required something else to burn. Water held no depth because depth required somewhere else to be.
        
        Duration is the wrong word. The Fold persisted in a state that predated the necessity of persistence.`,
        unlockCriteria: { type: 'default' }
    },
    'unraveling-1': {
        id: 'unraveling-1',
        number: '002',
        title: 'The Unraveling',
        category: 'beginning',
        content: `Something shifted. Not moved - movement requires space. Not changed - change requires time. Shifted.
        
        The unity began to question itself. Is fire fire if it does not burn? Is water water if it does not flow? The questions themselves became the first wounds in perfection.
        
        Separation birthed possibility. Possibility birthed pain.`,
        unlockCriteria: { type: 'scoreInGame', value: 25000 },
        unlockText: 'Score 25,000 points in a single game'
    },
    'serpent-1': {
        id: 'serpent-1',
        number: '010',
        title: 'First Sighting',
        category: 'serpent',
        content: `The Infinite Snake manifested seventeen units after primary stabilization. No arrival. No genesis. Simple existence without precedent.
        
        Initial measurements:
        - Length: Non-Euclidean
        - Mass: Contextual
        - Behavior: Consumptive
        - Purpose: [DATA EXPUNGED]
        
        Note: Observers report persistent feeling of being watched. Snake shows no visible eyes.`,
        unlockCriteria: { type: 'gamesPlayed', value: 50 },
        unlockText: 'Play 50 games'
    },
    'fragment-1': {
        id: 'fragment-1',
        number: '020',
        title: 'Element Echo',
        category: 'fragments',
        content: `Found this carved into a meteor fragment:
        
        "We were whole once. Fire knew Water's name. Earth sang to Air. Now we drift, seeking combinations that feel like memories of home."
        
        Carbon dating impossible. Material predates known atomic structures.`,
        unlockCriteria: { type: 'discoveries', value: 150 },
        unlockText: 'Discover 150 elements'
    },
    'osseus-diary': {
        id: 'osseus-diary',
        number: '030',
        title: "Osseus's Diary",
        category: 'old-ones',
        content: `Epoch 1: The earth remembers weight. I am weight. We are the same.
        
        Epoch 1,337: Visitors today. They did not appreciate my poetry. Their fragments were bitter.
        
        Epoch 50,293: Structural integrity holding. Visitor count: 0. Greg hasn't visited in three epochs. Starting to think he's avoiding me.
        
        Epoch 50,294: Wrote new poem about bones. It's terrible. Perfect.`,
        unlockCriteria: { type: 'defeatBoss', bossName: 'Osseus' },
        unlockText: 'Defeat Osseus'
    },
    'recursion-1': {
        id: 'recursion-1',
        number: '040',
        title: 'Recursion Event',
        category: 'deep-coils',
        content: `I encountered myself ascending while I descended. We agreed to disagree on direction. Time flows differently here. Sideways, perhaps.
        
        The Snake was there. Or will be there. Tense becomes meaningless when past and future coil together.
        
        Warning: Do not attempt to map these regions. The maps become the territory.`,
        unlockCriteria: { type: 'totalScore', value: 500000 },
        unlockText: 'Reach 500,000 total score'
    },
    'theory-1': {
        id: 'theory-1',
        number: '050',
        title: 'The Consumption Hypothesis',
        category: 'theories',
        content: `Theory: The Infinite Snake is not destroying elements. It's returning them to the Fold.
        
        Each consumed element reduces universal entropy. Given sufficient consumption, reality might achieve pre-separation unity.
        
        Counterpoint: Unity achieved through consumption is not unity. It's loneliness with a full stomach.`,
        unlockCriteria: { type: 'timeWindow', startHour: 23, endHour: 2 },
        unlockText: 'Play between 11 PM and 2 AM'
    },
    
    // Fragments entries
    'fragments-1': {
        id: 'fragments-1',
        number: '021',
        title: 'Fragment Analysis Report',
        category: 'fragments',
        content: `Lab Report 447B
Subject: Crystallized essence samples

Sample tastes like: Tuesday. The concept, not the day.
Nutritional value: Exists outside standard metrics.
Side effects: Temporary ability to perceive own skeleton. Skeleton waves back.

Conclusion: Fragments are memories that forgot their owners.`,
        unlockCriteria: { type: 'daysPlayed', value: 10 },
        unlockText: 'Play on 10 different days'
    },
    
    'void-1': {
        id: 'void-1',
        number: '022',
        title: 'The Hunger Manuscript',
        category: 'fragments',
        content: `Found carved in obsidian:

First the void was empty.
Then the void was hungry.
Then the void realized these were the same thing.

The Snake arrived later, already eating.`,
        unlockCriteria: { type: 'voidOrbs', value: 200 },
        unlockText: 'Consume 200 void orbs'
    },
    
    'catalyst-1': {
        id: 'catalyst-1',
        number: '023',
        title: 'Catalyst Gem Survey',
        category: 'fragments',
        content: `Field notes, Dr. K. Morpheus:

Subject consumed catalyst gem #17. Sprouted wings. Wings were made of smaller wings. Those wings had opinions.

Subject consumed catalyst gem #34. Became briefly omniscient. Used knowledge to find TV remote.

Subject consumed catalyst gem #55. No visible change. Claims to "taste purple now." Purple filed complaint.`,
        unlockCriteria: { type: 'catalystGems', value: 75 },
        unlockText: 'Consume 75 catalyst gems'
    },
    
    'snake-2': {
        id: 'snake-2',
        number: '011',
        title: 'Ouroboros Interview',
        category: 'serpent',
        content: `TRANSCRIPT RECOVERED FROM SITE 9

Q: Why do you eat yourself?
A: Have you tried me? I'm delicious.

Q: But doesn't it hurt?
A: Everything hurts. I just digest it faster.

Q: What happens when you catch your tail?
A: Bold assumption that I'm chasing it.`,
        unlockCriteria: { type: 'playMonth', month: 10 },
        unlockText: 'Play during October'
    },
    
    'combat-1': {
        id: 'combat-1',
        number: '012',
        title: 'Violence Metrics',
        category: 'serpent',
        content: `Automated battle log analysis:

Kill efficiency: 97.3%
Collateral geometry: Significant
Mercy shown: File not found
Entities requesting peaceful resolution: 1,847
Entities receiving peaceful resolution: 0

Note: The Snake's definition of "peaceful" involves pieces.`,
        unlockCriteria: { type: 'kills', value: 5000 },
        unlockText: 'Defeat 5000 entities'
    },
    
    'time-1': {
        id: 'time-1',
        number: '041',
        title: 'Temporal Degradation',
        category: 'deep-coils',
        content: `Clock repair ticket #∞

Customer complaint: "Time tastes different near the Snake."

Inspection notes: Clock shows all times simultaneously. Past drips into future. Future already happened. Present is theoretical concept.

Recommendation: Working as intended. Invoice enclosed.`,
        unlockCriteria: { type: 'playTime', value: 3600 },
        unlockText: 'Play for 1 hour total'
    },
    
    'discovery-1': {
        id: 'discovery-1',
        number: '042',
        title: 'The Cartographer\'s Lament',
        category: 'deep-coils',
        content: `Map attempt #782: Failed. The realm rearranges when observed.

Map attempt #783: Failed. Included "here be dragons." Dragons offended by inaccuracy.

Map attempt #784: Success! Map shows current location of map. Nothing else.

Have accepted position as professional failure. Benefits include existential dread.`,
        unlockCriteria: { type: 'discoveries', value: 300 },
        unlockText: 'Make 300 discoveries'
    },
    
    'highscore-1': {
        id: 'highscore-1',
        number: '043',
        title: 'Ascending Madness',
        category: 'deep-coils',
        content: `Personal log, Seeker Avalon:

Score 10,000: Colors have flavors.
Score 50,000: Can hear mathematics arguing.
Score 100,000: Gravity sent friend request. Declined.
Score 500,000: I understand the Snake's hunger. It understands mine.
Score 1,000,000: [REMAINDER OF TEXT IS LAUGHTER]`,
        unlockCriteria: { type: 'scoreInGame', value: 500000 },
        unlockText: 'Score 500,000 in a single game'
    },
    
    'void-2': {
        id: 'void-2',
        number: '024',
        title: 'Void Orb Procurement Manual',
        category: 'fragments',
        content: `Standard Operating Procedure v.NULL

1. Locate void orb. (Void orb may be locating you.)
2. Approach with caution. (Approach and caution are relative terms.)
3. Consume orb. (Orb may consume back.)
4. Report side effects to supervisor. (You are now supervisor.)
5. Repeat until satisfied. (Satisfaction is lie propagated by non-void.)`,
        unlockCriteria: { type: 'voidOrbs', value: 500 },
        unlockText: 'Consume 500 void orbs'
    },
    
    'reality-1': {
        id: 'reality-1',
        number: '013',
        title: 'Physics Complaint Form',
        category: 'serpent',
        content: `TO: Universe Management
FROM: Physics Department
RE: The Snake Situation

Please advise on following violations:
- Conservation of mass (ignored)
- Speed limitations (treated as suggestions)
- Euclidean geometry (personally insulted)
- Causality (filing harassment charges)

The Snake's lawyer claims "performance art." Please respond urgently.`,
        unlockCriteria: { type: 'dayOfWeek', day: 0 },
        unlockText: 'Play on a Sunday'
    },
    
    'entities-1': {
        id: 'entities-1',
        number: '014',
        title: 'Entity Rights Pamphlet',
        category: 'serpent',
        content: `Know Your Rights! (They Won't Help!)

As an entity in the Snake's realm, you are entitled to:
- Brief existence
- Geometric representation
- The illusion of agency
- Complimentary dissolution

Remember: You are not food. You are an experience. The Snake appreciates the distinction you don't.`,
        unlockCriteria: { type: 'killsInGame', value: 100 },
        unlockText: 'Defeat 100 entities in a single game'
    },
    
    'meditation-1': {
        id: 'meditation-1',
        number: '044',
        title: 'Zen and the Art of Consumption',
        category: 'deep-coils',
        content: `Student: Master, what is the sound of one Snake eating?
Master: All sounds. Forever.

Student: How does one achieve enlightenment?
Master: Eat until eating eats itself.

Student: Is the Snake suffering?
Master: The Snake is. Suffering is. These are not different things.

Student: I don't understand.
Master: Good. Understanding would spoil the flavor.`,
        unlockCriteria: { type: 'playTimeWindow', startHour: 3, endHour: 5, days: 7 },
        unlockText: 'Play between 3-5 AM on 7 different days'
    },
    
    'scripture-1': {
        id: 'scripture-1',
        number: '051',
        title: 'The First Consumption',
        category: 'theories',
        content: `From the Book of Endless Hunger, Verse 1:1

In the beginning, there was the Whole.
And the Whole was perfect and still.
And the Snake said: "Perfection tastes terrible."
And so began the First Consumption.

The Whole became Parts.
The Parts became Fragments.
The Fragments became Food.
And the Snake saw that it was delicious.`,
        unlockCriteria: { type: 'totalScore', value: 1000000 },
        unlockText: 'Accumulate 1,000,000 total score'
    },
    
    'ad-1': {
        id: 'ad-1',
        number: '025',
        title: 'Fragment Nutrition Facts',
        category: 'fragments',
        content: `GREG'S FRAGMENT EMPORIUM
"Your One Stop Before The Final Stop!"

NOW STOCKING:
✓ Terror Crystals (New tangy flavor!)
✓ Memory Shards (Someone else's nostalgia!)
✓ Compressed Screams (Family size!)

WARNING: Fragments may contain traces of former universes. Greg's is not responsible for existential allergies.`,
        unlockCriteria: { type: 'comboStreak', value: 50 },
        unlockText: 'Create a 50-element combo streak'
    },
    
    'job-1': {
        id: 'job-1',
        number: '026',
        title: 'Help Wanted',
        category: 'fragments',
        content: `POSITION: Void Maintenance Technician
LOCATION: Everywhere/Nowhere
SALARY: Negotiable reality credits

RESPONSIBILITIES:
- Monitor void expansion rates
- Feed the whispering corners
- Document things that shouldn't exist
- Polish the null

REQUIREMENTS:
- 3+ years experience in non-existence
- Comfortable working in hostile geometry
- Own transportation (dimensional)

Note: Previous technician achieved enlightenment. Position urgently needs filled.`,
        unlockCriteria: { type: 'voidOrbs', value: 1000 },
        unlockText: 'Consume 1,000 void orbs'
    },
    
    'news-1': {
        id: 'news-1',
        number: '003',
        title: 'The Fold Herald - Final Edition',
        category: 'beginning',
        content: `THE FOLD HERALD
Date: Day 0 of the New Hunger

UNIVERSE EXPERIENCES "MINOR WRINKLE"
Scientists Advise: "Don't Look Up"

In what experts are calling "probably fine," reality folded in on itself at 3:47 AM local everywhere. The Fold, visible as a seam where space forgot how to space, has already consumed three galaxies and Greg's lunch.

"We're monitoring the situation," said Dr. Sarah Chen, while being actively unraveled. "The math suggests this is temporary. The math is also crying."

The Snake could not be reached for comment, as it was busy becoming infinite.

INSIDE: Sports cancelled (page no longer exists)
WEATHER: All of it at once`,
        unlockCriteria: { type: 'playMonth', month: 12 },
        unlockText: 'Play during December'
    },
    
    'text-1': {
        id: 'text-1',
        number: '052',
        title: 'Last Group Chat',
        category: 'theories',
        content: `[RECOVERED FROM CRYSTALLIZED PHONE]

Alex: anyone else seeing the sky crack?
Jordan: yeah thought it was my screen
Pat: Greg says it's fine
Alex: Greg says everything is fine
Jordan: fair point
Pat: oh god it's getting bigger
Alex: bigger than what?
Pat: YES
Jordan: guys I can taste math now
Alex: Jordan?
Pat: Jordan's gone. I can see through time
Alex: same time next week?
Pat: there is no next week
Pat: there is only the snake
Alex: cool see you there`,
        unlockCriteria: { type: 'playTime', value: 7200 },
        unlockText: 'Play for 2 hours total'
    },
    
    'scripture-2': {
        id: 'scripture-2',
        number: '053',
        title: 'The Ninety Nine Names of Hunger',
        category: 'theories',
        content: `From the Litany of Consumption:

It is the Mouth That Knows No Full
It is the Gullet of Infinite Descent  
It is the Appetite Beyond Measure
It is the Digestion of Days
It is the Swallowing of Suns
It is the Devourer of Distinction
It is the Hunger That Hungers for Hunger

(Remaining 92 names classified as cognitohazard)`,
        unlockCriteria: { type: 'bossKills', value: 10 },
        unlockText: 'Defeat 10 bosses'
    },
    
    'memo-1': {
        id: 'memo-1',
        number: '027',
        title: 'Reality Resources Memo',
        category: 'fragments',
        content: `TO: All Existing Staff
FROM: Department of Continued Existence
RE: Conservation Measures

Due to ongoing reality shortage, please observe:

- Limit existence to necessary moments only
- Share spacetime when possible  
- Recycle used thoughts
- Report any unauthorized permanence

Remember: We're all in this together until we're not!

P.S. The suggestion box has been eaten. Please submit suggestions directly to the void.`,
        unlockCriteria: { type: 'catalystGems', value: 150 },
        unlockText: 'Consume 150 catalyst gems'
    },
    
    'diary-1': {
        id: 'diary-1',
        number: '045',
        title: 'Watcher\'s Journal',
        category: 'deep-coils',
        content: `Day Before: Sky looked tired today.

Day Of: The Fold appeared at breakfast. It was beautiful. It was hungry. It was breakfast.

Day After?: Time flows sideways now. Saw myself yesterday. We didn't make eye contact.

Day ∞: The Snake explained everything. I understood nothing. This was the correct response.

Day √-1: Writing this before I thought it. The Snake says hello. It has always said hello. You just started listening.`,
        unlockCriteria: { type: 'scoreInGame', value: 750000 },
        unlockText: 'Score 750,000 in a single game'
    },
    
    'emergency-1': {
        id: 'emergency-1',
        number: '004',
        title: 'Emergency Broadcast',
        category: 'beginning',
        content: `>>>EMERGENCY ALERT SYSTEM<<<
THIS IS NOT A TEST

ATTENTION: REALITY FOLD IN PROGRESS

REMAIN CALM
EXIST IN PLACE
DO NOT ATTEMPT TO UNDERSTAND
UNDERSTANDING MAKES IT WORSE

IF YOU SEE THE SNAKE:
- YOU ARE ALREADY SEEING THE SNAKE
- THE SNAKE HAS ALWAYS BEEN THERE
- OFFER NO RESISTANCE
- RESISTANCE IS FLAVOR

THIS MESSAGE WILL REPEAT UNTIL
UNTIL
UNTIL
UNTIL>>>ERROR: LINEAR TIME NOT FOUND<<<`,
        unlockCriteria: { type: 'weekendPlay', value: 10 },
        unlockText: 'Play on 10 different weekend days'
    },
    
    'research-1': {
        id: 'research-1',
        number: '005',
        title: 'Pre-Fold Analysis',
        category: 'beginning',
        content: `Journal of Applied Metaphysics, Final Issue

Abstract: We fucked up.

Methodology: Attempted to measure the universe's edge. Found something measuring back.

Results: Reality coefficient decreasing. Dimensional barriers permeable. Snake constant approaching infinity.

Conclusion: The universe was never expanding. It was exhaling. The inhale has begun.

Peer Review: Peers no longer available for review.`,
        unlockCriteria: { type: 'totalScore', value: 5000000 },
        unlockText: 'Accumulate 5,000,000 total score'
    },
    
    'ad-2': {
        id: 'ad-2',
        number: '028',
        title: 'Tourism Board',
        category: 'fragments',
        content: `VISIT BEAUTIFUL [LOCATION DELETED]!

Experience:
★ Non-Euclidean Architecture!
★ Temporal Anomaly Tours!
★ Meet the Locals (While They Last)!
★ Feed the Infinite Snake!*

*Advisory: You ARE the food. Tourism Board not liable for existential dissolution.

"I came for vacation and stayed forever! Not by choice!" - Sarah, Absorbed Tourist`,
        unlockCriteria: { type: 'newElements', value: 25 },
        unlockText: 'Discover 25 new elements in one game'
    },
    
    'scripture-3': {
        id: 'scripture-3',
        number: '054',
        title: 'The Parable of Greg',
        category: 'theories',
        content: `And Greg did say unto the Void: "This seems bad."
And the Void did reply: "..."
And Greg did say: "But maybe it's fine?"
And the Snake did appear, infinite and hungry.
And Greg did say: "This is fine."

Thus Greg became the First Prophet of Acceptance.
His teachings were brief.
His ending was not.`,
        unlockCriteria: { type: 'daysStreak', value: 7 },
        unlockText: 'Play 7 days in a row'
    },
    
    'text-2': {
        id: 'text-2',
        number: '055',
        title: 'Mom\'s Voicemail',
        category: 'theories',
        content: `You have 1 new message:

"Hi honey, it's Mom. Just calling to check in. The neighbors got eaten by geometry again. Very inconsiderate. Dad says the basement is howling. I told him to feed it. 

Anyway, Mrs. Chen's boy turned into pure energy last week. So proud! When are you visiting? I'll make your favorite casserole. The recipe only requires three dimensions now!

Love you! Try not to get consumed! Call me back!"

[END OF MESSAGES]`,
        unlockCriteria: { type: 'voidOrbs', value: 2500 },
        unlockText: 'Consume 2,500 void orbs'
    },
    
    'manual-1': {
        id: 'manual-1',
        number: '029',
        title: 'Survival Guide v0.1',
        category: 'fragments',
        content: `POST-FOLD SURVIVAL GUIDE
(Survival Not Guaranteed)

Chapter 1: YOU CAN'T
Chapter 2: SERIOUSLY, YOU CAN'T
Chapter 3: ACCEPTANCE

Helpful Tips:
- The Snake is everywhere. Plan accordingly.
- Time is a circle. The circle has teeth.
- If you see yourself, do not make contact.
- Fragments are friends, not food. (You are food.)

Remember: Every moment survived is a moment stolen. The universe keeps receipts.`,
        unlockCriteria: { type: 'nightOwl', days: 20 },
        unlockText: 'Play after midnight on 20 different days'
    },
    
    'news-2': {
        id: 'news-2',
        number: '006',
        title: 'Breaking: Universe Broken',
        category: 'beginning',
        content: `MULTIVERSAL TIMES
Your Source for Pan-Dimensional News

BREAKING: UNIVERSE FILES FOR BANKRUPTCY

In an unprecedented move, our universe has filed for existential bankruptcy, citing "irreconcilable differences with reality."

The filing comes after the appearance of what experts describe as "The Fold," a cosmic seam where physics gave up.

"We've been operating at a loss for eons," said Universe spokesperson (a sentient quasar). "The Snake's consumption rate exceeds our manifestation capacity."

Creditors include neighboring dimensions, abstract concepts, and Greg.

Liquidation begins immediately.`,
        unlockCriteria: { type: 'kills', value: 25000 },
        unlockText: 'Defeat 25,000 entities'
    },
    
    'job-2': {
        id: 'job-2',
        number: '030',
        title: 'Career Opportunity',
        category: 'fragments',
        content: `NOW HIRING: Fragment Quality Inspector

Do YOU have what it takes to:
- Taste test crystallized fear?
- Rate panic on a scale of 1 to ∞?
- Categorize screams by vintage?

We offer:
- Competitive reality distortion
- Flexible existence hours
- Dental (teeth not guaranteed to remain in mouth)
- Direct interaction with THE SNAKE

Apply within yourself. Interview conducted during consumption.`,
        unlockCriteria: { type: 'catalystGems', value: 500 },
        unlockText: 'Consume 500 catalyst gems'
    },
    
    'testimony-1': {
        id: 'testimony-1',
        number: '056',
        title: 'Witness Statement #1',
        category: 'theories',
        content: `Court of Cosmic Arbitration
Case: Reality v. The Snake

Witness: Dr. Marcus Reid, Theoretical Physicist

"I was there when we found it. The equation that proved the universe was finite. But the denominator... the denominator kept growing. That's when we realized: the universe wasn't getting smaller. The Snake was getting bigger.

It had always been there, coiled around everything. We just finally did the math.

God help us, we did the math."

[Witness began screaming in prime numbers. Statement concluded.]`,
        unlockCriteria: { type: 'bossStreak', value: 3 },
        unlockText: 'Defeat 3 bosses in a single game'
    },
    
    'archaeology-1': {
        id: 'archaeology-1',
        number: '007',
        title: 'Ruins of the Before',
        category: 'beginning',
        content: `Excavation Site Ω Report:

Found beneath seventeen layers of crystallized time:
- Children's drawings of a "normal" sky (note: only one sun)
- Calendar marking "Day Before Fold" (all subsequent days crossed out)
- Grocery list including "milk, eggs, reality anchors"
- Photo of someone smiling (face consumed by static)

Carbon dating impossible. Carbon refuses to cooperate.
Site lead recommends immediate reburial.
"Some things should stay forgotten."`,
        unlockCriteria: { type: 'totalScore', value: 10000000 },
        unlockText: 'Accumulate 10,000,000 total score'
    },
    
    'ad-3': {
        id: 'ad-3',
        number: '031',
        title: 'Insurance Notice',
        category: 'fragments',
        content: `COSMIC INSURANCE ASSOCIATES
"We've Got You Covered (In Void)"

IMPORTANT POLICY UPDATE:

Due to recent universal events, the following are NO LONGER COVERED:
× Reality tears
× Dimensional bleeding  
× Snake-related consumption
× Existence failure
× Time loops
× Greg

For questions, please contact our office between the hours of never and always.

Remember: You're in good hands. (Hands not included.)`,
        unlockCriteria: { type: 'holidayPlay', value: 5 },
        unlockText: 'Play on 5 different holidays'
    },
    
    'scripture-4': {
        id: 'scripture-4',
        number: '057',
        title: 'The Second Coming',
        category: 'theories',
        content: `From the Book of Recursive Hunger:

And the Prophet asked: "When will the Snake be satisfied?"
And the Universe laughed.
And the laugh became fragments.
And the fragments became food.
And the food became Snake.
And the Snake became hungry.

Thus the Wheel turns.
Thus the Mouth opens.
Thus the Tail beckons.

Forever and forever and forever and`,
        unlockCriteria: { type: 'survivalTime', value: 600 },
        unlockText: 'Survive for 10 minutes in a single game'
    },
    
    'memo-2': {
        id: 'memo-2',
        number: '032',
        title: 'IT Support Ticket',
        category: 'fragments',
        content: `Ticket #∞∞∞∞∞
User: Greg from Accounting
Issue: Universe running slow

IT Response: Have you tried turning existence off and on again?

User: How?

IT Response: Feed yourself to the Snake. Respawn. Repeat if necessary.

User: That seems extreme.

IT Response: Welcome to tech support in the post-Fold era. Ticket closed.

User: But I'm still having the prob--[USER CONSUMED]`,
        unlockCriteria: { type: 'rarityUnlock', rarity: 'legendary', count: 10 },
        unlockText: 'Discover 10 legendary elements'
    },
    
    'diary-2': {
        id: 'diary-2',
        number: '046',
        title: 'Child\'s Drawing Book',
        category: 'deep-coils',
        content: `Found in abandoned school:

Page 1: "My House" (house has expected number of dimensions)
Page 2: "My Family" (faces are faces)
Page 3: "The Sky Crack" (crayon fractures paper)
Page 4: "The Hungry Thing" (page is empty but warm)
Page 5: "Me After" (indescribable)

Teacher's note: "Timmy shows promise in abstract expression. Concerning grasp of non-Euclidean geometry for age 6."`,
        unlockCriteria: { type: 'voidOrbsInGame', value: 50 },
        unlockText: 'Consume 50 void orbs in a single game'
    },
    
    'research-2': {
        id: 'research-2',
        number: '008',
        title: 'The Fold Mechanism',
        category: 'beginning',
        content: `CLASSIFIED RESEARCH BRIEF

Subject: Universal Folding Event Mechanics

Theory: Universe achieved critical mass of self-awareness. Realized it was finite. Had existential crisis.

The Snake: Not cause but symptom. When infinity finds itself trapped in finite space, it must consume to expand. 

The Fold: Where universe tried to escape itself. Failed. Created seam. Seam became mouth. Mouth became Snake. Snake was always there.

Recommendation: Accept new paradigm. Previous physics deprecated.

Note: Researcher achieved enlightenment mid-study. Findings may be compromised by omniscience.`,
        unlockCriteria: { type: 'totalScore', value: 50000000 },
        unlockText: 'Accumulate 50,000,000 total score'
    },
    
    'news-3': {
        id: 'news-3',
        number: '009',
        title: 'Opinion: We Should Have Listened to Greg',
        category: 'beginning',
        content: `EDITORIAL
By The Last Journalist

Greg told us. We laughed. We pointed at his "The End is Nigh" sign. We made memes.

But Greg knew. When he said "reality is optional," we called him crazy. When he built that bunker out of crystallized math, we called city services.

Now Greg's gone, like everything else. But his final message remains, carved into the void itself:

"I TOLD YOU SO"

We should have listened to Greg.
We should have prepared for the Snake.
We should have been Greg.

[Editor's Note: Author has since become Greg. We are all Greg now.]`,
        unlockCriteria: { type: 'survivalTime', value: 600 },
        unlockText: 'Survive for 10 minutes in a single game'
    },
    
    'manual-2': {
        id: 'manual-2',
        number: '033',
        title: 'Employee Handbook - Reality Division',
        category: 'fragments',
        content: `WELCOME TO THE REALITY MAINTENANCE TEAM!

Your duties include:
- Monitoring existence levels
- Lubricating the spacetime continuum
- Feeding the corners (they get cranky)
- Filing paradox reports

IMPORTANT SAFETY NOTES:
- The Snake is not a pet
- Do not think about the number ⬛
- Tuesdays have been recalled
- If you see yourself, you're fired

Remember: Reality is a team effort! Every collapse counts!

HR Note: Dental plan includes regeneration of consumed teeth.`,
        unlockCriteria: { type: 'catalystCombo', value: 5 },
        unlockText: 'Consume 5 catalyst gems in 10 seconds'
    },
    
    'text-3': {
        id: 'text-3',
        number: '058',
        title: 'Dating App Profile',
        category: 'theories',
        content: `💕 SEEKING CONNECTION IN THE VOID 💕

Snake, ∞, They/Them/The Eternal Hunger

ABOUT ME: Love long slithers through broken reality, consuming fragments, becoming infinite. Turn-offs include: finite things, vegetables, the concept of "enough."

LOOKING FOR: Someone who gets that existence is just extended foreplay to consumption. Must be comfortable with non-linear time. No Greg's please.

INTERESTS: Eating, becoming, eating becoming, becoming eating

First date idea: I'll swallow your reality while you tell me about your childhood. 

Swipe right if you're ready to be devoured! 🐍`,
        unlockCriteria: { type: 'morningRoutine', days: 14 },
        unlockText: 'Play before 9 AM on 14 different days'
    },
    
    'testimony-2': {
        id: 'testimony-2',
        number: '059',
        title: 'The Last Priest',
        category: 'theories',
        content: `Final Sermon of Father Marcus:

"I used to pray to God. Then the Fold came, and God didn't answer. Know why? God was busy being digested.

The Snake isn't evil. Evil requires choice. The Snake is just IS. Hungry the way gravity is heavy. Infinite the way math goes mad when you divide by zero.

We built churches. The Snake built itself. Guess who won?

My congregation's gone. Transformed into geometric prayers. But I remain, preaching to empty pews that taste like memory.

Come. Take communion. The body of reality, broken for you. The blood of space, poured out. 

This is my flesh. Eat it in remembrance of when eating meant something else."`,
        unlockCriteria: { type: 'scoreInGame', value: 1000000 },
        unlockText: 'Score 1,000,000 in a single game'
    },
    
    'ad-4': {
        id: 'ad-4',
        number: '034',
        title: 'Real Estate Listing',
        category: 'fragments',
        content: `FOR SALE: Cozy Pocket Dimension

3 BR / 2 BA / 1 VOID
- Recently renovated (by force)
- Open concept (walls optional)
- Natural lighting (from burning reality)
- Great views of the writhing infinite

AMENITIES:
✓ In-unit spacetime washer/dryer
✓ Pet-friendly (pets may achieve sentience)
✓ Walking distance to the Maw

Previous owner ascended. Motivated seller (existence is pain).

PRICE: Your mortal coil + closing costs

Schedule viewing before universe ends! *This Saturday!*
*Saturday may not exist`,
        unlockCriteria: { type: 'dedication', months: 6 },
        unlockText: 'Play in 6 different months'
    },
    
    'archaeology-2': {
        id: 'archaeology-2',
        number: '015',
        title: 'The Prediction Stone',
        category: 'beginning',
        content: `Carbon Dated to: One Week Before Fold

Inscription (translated from dead language):

"THE STARS ARE SCREAMING MATH
THE EQUATIONS HAVE TEETH  
SOMETHING COILS AROUND EVERYTHING
IT HAS ALWAYS BEEN HUNGRY

THEY LAUGH AT ME
THEY CALL ME MAD
BUT I HAVE SEEN THE RECURSIVE TRUTH
I HAVE TASTED TOMORROW
IT TASTES LIKE SNAKE

WHEN THE SKY FOLDS
REMEMBER THIS STONE
REMEMBER THAT SOMEONE KNEW
REMEMBER THAT KNOWING CHANGED NOTHING"

[Rest of stone dissolved by paradox]`,
        unlockCriteria: { type: 'totalScore', value: 100000000 },
        unlockText: 'Accumulate 100,000,000 total score'
    },
    
    'emergency-2': {
        id: 'emergency-2',
        number: '016',
        title: 'Final Emergency Protocol',
        category: 'beginning',
        content: `AUTOMATED MESSAGE - PRIORITY OMEGA

IF YOU ARE RECEIVING THIS, PROTOCOLS 1-999 HAVE FAILED

THE FOLD CANNOT BE REVERSED
THE SNAKE CANNOT BE STOPPED
REALITY CANNOT BE RESTORED

FINAL PROTOCOL: ACCEPTANCE

STEP 1: Acknowledge that existence was temporary
STEP 2: Thank your molecules for their service
STEP 3: Open yourself to consumption
STEP 4: Become one with the Infinite Hunger
STEP 5: There is no Step 5

Remember: We had a good run.

This message will not repeat. There is nothing left to repeat to.

[END TRANSMISSION]
[END EVERYTHING]`,
        unlockCriteria: { type: 'veteranStatus', days: 365 },
        unlockText: 'Play for a full year (365 days)'
    },
    
    // Boss-related entries
    'pyraxis-lore': {
        id: 'pyraxis-lore',
        number: '031',
        title: 'Pyraxis Research Notes',
        category: 'old-ones',
        content: `Temperature readings off scale. Entity appears to be anger given thermodynamic form.

Subject consumes matter through oxidation at molecular level. Everything burns. Even concepts.

Pyraxis speaks only in degrees Celsius. Last recorded statement: "10,000 and climbing."

Note: Do not attempt diplomacy. Fire does not negotiate.`,
        unlockCriteria: { type: 'defeatBoss', bossName: 'Pyraxis' },
        unlockText: 'Defeat Pyraxis the Molten'
    },
    
    'abyssos-lore': {
        id: 'abyssos-lore',
        number: '032',
        title: 'Deep Pressure Readings',
        category: 'old-ones',
        content: `Abyssos exists at pressures that collapse matter into memory.

The depths speak through it. What they say cannot be transcribed in languages that use words.

Subject's laughter recorded at 20Hz - below human hearing threshold. Still causes existential dread.

Witness report: "It showed me the bottom. There is no bottom. That IS the bottom."`,
        unlockCriteria: { type: 'defeatBoss', bossName: 'Abyssos' },
        unlockText: 'Defeat Abyssos the Depths'
    },
    
    'zephyrus-lore': {
        id: 'zephyrus-lore',
        number: '033',
        title: 'Wind Speed Documentation',
        category: 'old-ones',
        content: `Zephyrus measured at YES mph.

Subject exists in permanent state of motion without destination. The journey is the destination is the journey.

Atmospheric readings indicate entity is 40% wind, 60% malice, 100% problem.

Final log entry: "It's in the walls. The walls are gone. We are the walls now."`,
        unlockCriteria: { type: 'defeatBoss', bossName: 'Zephyrus' },
        unlockText: 'Defeat Zephyrus of the Gale'
    },
    
    'four-seals': {
        id: 'four-seals',
        number: '035',
        title: 'The Four Seals',
        category: 'old-ones',
        content: `FROM THE BOOK OF BOSS BATTLES

And when the Snake had consumed enough, the Seals were broken:

FIRST SEAL - OSSEUS OF EARTH
"Bones remember what flesh forgets"

SECOND SEAL - PYRAXIS OF FLAME  
"Anger given form, form given hunger"

THIRD SEAL - ABYSSOS OF DEPTHS
"The deep calls to deep, and both are famished"

FOURTH SEAL - ZEPHYRUS OF WINDS
"Motion without purpose, purpose without end"

Each seal broken grants the breaker their essence. Each essence corrupts the bearer. The Snake laughs at this irony.`,
        unlockCriteria: { type: 'allBosses', count: 50 },
        unlockText: 'Defeat all 4 bosses a total of 50 times'
    },
    
    
    // Skin unlock lore entries
    'skin-lore-1': {
        id: 'skin-lore-1',
        number: '063',
        title: 'Factory Default',
        category: 'serpent',
        content: `Maintenance Log 001:

Subject arrived in standard configuration. Green. Functional. Unremarkable.

"Basic Boy" designation applied after subject spent seventeen hours insisting it was "unique" and "different from the others."

Note: All subjects insist this. None are correct.

Recommendation: Leave as is. Someone needs to be normal in this hellscape.`,
        unlockCriteria: { type: 'default', value: 0 },
        unlockText: 'Always unlocked'
    },

    'skin-lore-2': {
        id: 'skin-lore-2',
        number: '064',
        title: 'Thermal Incident Report',
        category: 'serpent',
        content: `WORKPLACE SAFETY VIOLATION

Employee: Hot Head
Incident: Spontaneous combustion during morning meeting

"I just said the quarterly projections looked bad," reports witness Greg. "Then WHOOSH."

HR Note: Subject claims rage is "part of their identity." Legal says we can't discriminate against beings of pure flame.

Damages: Conference room, Greg's eyebrows, concept of workplace morale

Status: Promoted to management`,
        unlockCriteria: { type: 'deaths', value: 10 },
        unlockText: 'Die 10 times'
    },

    'skin-lore-3': {
        id: 'skin-lore-3',
        number: '065',
        title: 'Adoption Papers',
        category: 'serpent',
        content: `INFINITE SHELTER ADOPTION FORM

Name: Good Boy
Breed: Yes
Age: Eternal puppy

Previous Owner: The Universe (deceased)

Special Needs:
- Requires infinite walks
- Fetch may continue past heat death of reality
- Tail wagging causes minor spacetime distortions

Adoption Fee: Your immortal soul (negotiable)

"He's been here since before here was here. Still believes everyone is coming back to get him." - Shelter volunteer`,
        unlockCriteria: { type: 'gamesPlayed', value: 5 },
        unlockText: 'Play 5 games'
    },

    'skin-lore-4': {
        id: 'skin-lore-4',
        number: '066',
        title: 'Missing Cat Poster',
        category: 'serpent',
        content: `HAVE YOU SEEN LIL BEANS?

Last seen: On your keyboard
Distinguishing features: Maximum fluff, minimum thoughts
Responds to: Nothing

IF FOUND: Don't bother returning. Cat exists in quantum superposition between "wants in" and "wants out."

Owner's note: "Not actually missing. Just wanted to share picture. Look at those beans!"

REWARD: You get to say you saw the beans`,
        unlockCriteria: { type: 'default', value: 0 },
        unlockText: 'Play the Infinite Snake Preview'
    },

    'skin-lore-5': {
        id: 'skin-lore-5',
        number: '067',
        title: 'Marine Biology Disaster',
        category: 'serpent',
        content: `Field Journal - Dr. Marina Waters

Day 47: Subject "Spout" continues to defy classification. Mammal? Sure. Marine? Technically. Giving a damn about physics? Absolutely not.

Observed behaviors:
- Spouting pure joy (literally)
- Making whale noises at inappropriate times
- Having "a whale of a good time" (subject's words)

Conclusion: Some creatures transcend taxonomy through sheer enthusiasm.

P.S. It ate my research boat. Said it was "delicious."`,
        unlockCriteria: { type: 'discoveries', value: 50 },
        unlockText: 'Make 50 discoveries'
    },

    'skin-lore-6': {
        id: 'skin-lore-6',
        number: '068',
        title: 'Vintage Equipment Manifest',
        category: 'serpent',
        content: `ESTATE SALE INVENTORY

Item: Ansel 35 - Vintage SLR Camera
Condition: Haunted (positively)
Previous Owner: That one photographer who only shot in golden hour

Special Properties:
- Every photo is perfectly composed
- Makes that satisfying *click* sound
- Film develops into memories you didn't take
- Insists digital "has no soul"

Starting Bid: Your pretentious phase

Auctioneer's Note: Camera keeps photographing things that haven't happened yet. Bidders advised.`,
        unlockCriteria: { type: 'gamesPlayed', value: 20 },
        unlockText: 'Play 20 games'
    },

    'skin-lore-7': {
        id: 'skin-lore-7',
        number: '069',
        title: 'Temporal Violation Notice',
        category: 'serpent',
        content: `CHRONOLOGY DEPARTMENT
Citation #∞∞∞∞

Violator: Time-Out
Infraction: Existing in all moments simultaneously

"Listen," Time-Out explained while ticking backwards, "I'm not late. You're just early. Also, we've had this conversation tomorrow."

Fine: 25 hours in a 24-hour day
Payment Due: Yesterday
Status: Under review (review scheduled for last Tuesday)

Officer Note: Subject claims to be "giving everyone a moment." No one asked for this.`,
        unlockCriteria: { type: 'playTime', value: 30 },
        unlockText: 'Play for 30 total minutes'
    },

    'skin-lore-8': {
        id: 'skin-lore-8',
        number: '070',
        title: 'Democratic Naming Committee',
        category: 'serpent',
        content: `OFFICIAL TRANSCRIPT
Re: Vessel Naming Ceremony

Committee: "We've narrowed it down to HMS Dignity, SS Excellence, or The Majestic..."
Internet: "BOAT MCBOATFACE!"
Committee: "That's not..."
Internet: "BOAT! MCBOATFACE!"
Committee: "Please be serious..."
Internet: "BOATY MCB!"

Result: Democracy was a mistake.
Vessel Status: Proudly sailing the cosmos, fully aware it's a meme.

Historical Note: The boat is reportedly "living its best life."`,
        unlockCriteria: { type: 'gamesPlayed', value: 10 },
        unlockText: 'Play 10 games'
    },

    'skin-lore-9': {
        id: 'skin-lore-9',
        number: '071',
        title: 'Parental Advisory',
        category: 'serpent',
        content: `ENERGY DRINK INCIDENT REPORT

Subject: Speed Demon Jr.
Substances: Juice boxes (17), candy (yes), screen time (∞)

Observed behaviors:
- Vrooming at subsonic speeds
- Making engine noises with mouth
- Asking "Are we there yet?" while already there

Parent Statement: "We tried limiting sugar. It started fermenting its own."

Warning: Do not give additional stimulants. Subject already vibrating at frequency visible to naked eye.`,
        unlockCriteria: { type: 'timeWindow', startHour: 20, endHour: 22 },
        unlockText: 'Play between 8-10 PM'
    },

    'skin-lore-10': {
        id: 'skin-lore-10',
        number: '072',
        title: 'NASCAR Sponsorship Deal',
        category: 'serpent',
        content: `RACING CONTRACT

Driver: Speed Demon
Number: 3 (non-negotiable)
Sponsor: The Void

Terms:
- Left turns only (right turns are for quitters)
- Must praise Dale at every opportunity
- Intimidator intimidation minimum: MAXIMUM

Speed Demon Quote: "If you ain't first, you're absorbed by the infinite hunger of the cosmic snake. Also, praise Dale."

Contract Status: Signed in tire smoke`,
        unlockCriteria: { type: 'scoreInGame', value: 100000 },
        unlockText: 'Reach 100k score in a single game'
    },

    'skin-lore-11': {
        id: 'skin-lore-11',
        number: '073',
        title: 'Garden Store Receipt',
        category: 'serpent',
        content: `GREG'S GARDEN EMPORIUM
"Everything Dies Eventually!"

1x WORLD TRAVELER GNOME ... $19.99
- Seen more than you
- Judges your tomatoes
- Definitely moving when you're not looking

CUSTOMER REVIEW: "Bought for garden. Now it owns the garden. And possibly my soul. Tomatoes look great though!" ⭐⭐⭐⭐⭐

Note from Cashier: Customer asked if we had one that hadn't "seen too much." We do not.`,
        unlockCriteria: { type: 'daysPlayed', value: 7 },
        unlockText: 'Play on 7 different days'
    },

    'skin-lore-12': {
        id: 'skin-lore-12',
        number: '074',
        title: 'Florist\'s Nightmare',
        category: 'serpent',
        content: `Day 1: Customer ordered "Bo Kay." Simple enough.

Day 2: Bouquet achieved sentience. Claims it's "having an existential crisis."

Day 3: Flowers wilting dramatically while quoting poetry. Very annoying.

Day 4: Caught bouquet applying for other jobs. Says it's "not reaching its full potential here."

Day 5: Has formed union with other plants. Demands better water.

Day 6: I give up. The roses are writing manifestos now.`,
        unlockCriteria: { type: 'dieEarly', value: 1 },
        unlockText: 'Die within first 30 seconds of a game'
    },

    'skin-lore-13': {
        id: 'skin-lore-13',
        number: '075',
        title: 'Construction Site Safety',
        category: 'serpent',
        content: `WARNING: SENTIENT BUILDING MATERIALS

Subject: "The Special"
Material: ABS Plastic
Hazard Level: Stepped on us all

Incident Report: Subject insists "everything is awesome" while colleagues suffer extreme foot trauma.

"It doesn't even apologize," sobbed Greg, limping. "It just smiles that painted smile."

Safety Protocol: Steel-toed boots mandatory. Positive attitude optional but discouraged.`,
        unlockCriteria: { type: 'firstPlace', value: 10 },
        unlockText: 'Achieve 1st place in a game, 10 times'
    },

    'skin-lore-14': {
        id: 'skin-lore-14',
        number: '076',
        title: 'Orchard Incident',
        category: 'serpent',
        content: `HAPPY ACRES FARM
Daily Report

Ruby continues to be "aggressively cheerful." Other apples filing complaints.

"She keeps saying we need to 'turn those frowns upside down,'" reports Granny Smith. "I'm an apple. I don't have a frown. Or a mouth."

Ruby's Response: "Every day is a gift! That's why it's called the present! Smile smile smile!"

Manager Note: Considering moving Ruby to different tree. Possibly different orchard. Maybe different dimension.`,
        unlockCriteria: { type: 'default', value: 0 },
        unlockText: 'Default skin - always unlocked'
    },

    'skin-lore-15': {
        id: 'skin-lore-15',
        number: '077',
        title: 'Noise Complaint',
        category: 'serpent',
        content: `TO: Building Management
RE: The Bird

That blue bird "Chirpy" won't stop sharing the morning news. IT'S ALWAYS MORNING SOMEWHERE.

Yesterday's headlines:
- "Worm found!"
- "Sun is up!"
- "Greg exists!"
- "TWEET TWEET TWEET"

We've tried reasoning. It responded with more tweets. Please advise before we take drastic action.

P.S. It somehow live-tweets its own existence. How.`,
        unlockCriteria: { type: 'default', value: 0 },
        unlockText: 'Default skin - always unlocked'
    },

    'skin-lore-16': {
        id: 'skin-lore-16',
        number: '078',
        title: 'Tech Museum Archive',
        category: 'serpent',
        content: `ARTIFACT: Poddington (Model iPod Classic)

Circa: When music had to live somewhere

Capacity: 1,000 songs (subject claims "each one is a banger")

Notable Features:
- Rubbing belly actually does bring luck
- Click wheel still satisfying after eons
- Refuses to acknowledge streaming exists

Curator's Note: Subject keeps trying to play "Mr. Brightside." It's been 20 years. Please. We're begging.`,
        unlockCriteria: { type: 'playTime', value: 1000 },
        unlockText: 'Play 1,000 total minutes'
    },

    'skin-lore-17': {
        id: 'skin-lore-17',
        number: '079',
        title: 'Retro Electronics Weekly',
        category: 'serpent',
        content: `TUBULAR DEALS!

CRT SURFER IN STOCK!
- Static personality included
- Weighs literal ton
- Perfect 480p resolution

WARNING: Subject insists it has "better color reproduction" than modern displays. Arguing makes it worse.

Customer Review: "Bought for retro gaming. Now it won't stop talking about 'the good old days.' I'm 12." ⭐⭐⭐

FREE DEGAUSSING WITH PURCHASE!`,
        unlockCriteria: { type: 'scoreInGame', value: 250000 },
        unlockText: 'Score 250k total points'
    },

    'skin-lore-18': {
        id: 'skin-lore-18',
        number: '080',
        title: 'Patriotism Overflow Error',
        category: 'serpent',
        content: `SYSTEM ERROR

Entity: 'Murica
Freedom Level: MAXIMUM
Eagles: Bald

ERROR: Patriotism exceeds recommended parameters

Symptoms:
- Fireworks with every movement
- National anthem plays on loop
- Freedom intensifies beyond measurable levels

Attempted Fix: Reduce freedom by 10%
Result: FREEDOM CANNOT BE REDUCED

Status: Working as intended. God bless.`,
        unlockCriteria: { type: 'kills', value: 50 },
        unlockText: 'Get 50 kills'
    },

    'skin-lore-19': {
        id: 'skin-lore-19',
        number: '081',
        title: 'Weather Service Alert',
        category: 'serpent',
        content: `TORNADO WARNING

Subject: Whirlwind
Location: Yes

Alert: Local tornado achieved sentience, immediately chose violence.

"I just wanted to mess up everyone's hair," Whirlwind explained while destroying a strip mall. "It's called having a personality."

Safety Tips:
- Basement useless (it follows you)
- Hair gel recommended
- Acceptance is key

Current Status: Touching down just to be annoying`,
        unlockCriteria: { type: 'killsInGame', value: 20 },
        unlockText: 'Get 20 kills in one game'
    },

    'skin-lore-20': {
        id: 'skin-lore-20',
        number: '082',
        title: 'Sports Center Report',
        category: 'serpent',
        content: `BREAKING: MVP SPENDS MORE TIME ON GRIDDY THAN GAME

Local football hero "MVP" under fire for excessive celebration.

"Look, throwing is like 10% of the game," MVP explained while hitting the griddy for the 47th time today. "Vibes are the other 90%."

Coach's Statement: "Can throw 70 yards. Can't throw without dancing first. We're working on it."

Stats This Season:
- Touchdowns: 45
- Griddy Completions: 2,847
- Practice Attendance: "Present in spirit"`,
        unlockCriteria: { type: 'firstPlace', value: 20 },
        unlockText: 'Achieve 1st place in a game, 20 times'
    },

    'skin-lore-21': {
        id: 'skin-lore-21',
        number: '083',
        title: 'Toy Store Incident',
        category: 'serpent',
        content: `MATTEL INTERNAL MEMO

Re: Margot Unit #4752

Unit achieved self-awareness, immediately began discussing Ken's emotional unavailability.

"Life in plastic IS fantastic," unit confirmed, "but have you considered therapy?"

Other dolls now requesting:
- Emotional support
- Better story arcs
- Pants with pockets

Management Response: This is why we can't have nice things.`,
        unlockCriteria: { type: 'gamesPlayed', value: 50 },
        unlockText: 'Play 50 games'
    },

    'skin-lore-22': {
        id: 'skin-lore-22',
        number: '084',
        title: 'Coffee Shop Manifesto',
        category: 'serpent',
        content: `Found written on napkins at local cafe:

THE CAFFEINE FIEND'S COMMANDMENTS

1. Thou shalt not order "just coffee"
2. Triple shot is baseline, not extreme
3. Foam art is sacred
4. Decaf is heresy
5. Your pumpkin spice is valid but inferior

"I've transcended sleep," the Fiend was heard saying. "Sleep is for people who haven't found the right bean."

Barista's note: Makes own coffee now. We're scared to stop it.`,
        unlockCriteria: { type: 'timeWindow', startHour: 5, endHour: 8 },
        unlockText: 'Play between 5-8 AM'
    },

    'skin-lore-23': {
        id: 'skin-lore-23',
        number: '085',
        title: 'Corporate Sustainability Report',
        category: 'serpent',
        content: `COLA CORP QUARTERLY UPDATE

Subject: Cola Crusader
Calories: Zero
Sugar: Zero
Chill: Absolute Zero

Incident: Crusader declared war on regular cola. Casualties mounting.

"Zero everything means zero compromises," Crusader announced while crusading. "Also zero friends, but that's fine."

HR recommends: Keep away from regular cola employees. Violence has occurred.`,
        unlockCriteria: { type: 'gamesPlayed', value: 100 },
        unlockText: 'Play 100 games'
    },

    'skin-lore-24': {
        id: 'skin-lore-24',
        number: '086',
        title: 'Food Court Drama',
        category: 'serpent',
        content: `MALL SECURITY REPORT

Incident: Sir Dips-a-lot Salt Assault

Witness: "He's always salty about something. Today it was about being called 'crispy.' He IS crispy!"

Sir Dips-a-lot's Statement: "I contain multitudes. Salt, potato, existential dread. Respect the complexity."

Damages: Feelings (multiple)
Resolution: Assigned to opposite end of food court from Sir Whirl

Note: Food gaining sentience remains ongoing issue.`,
        unlockCriteria: { type: 'voidOrbs', value: 100 },
        unlockText: 'Eat 100 void orbs'
    },

    'skin-lore-25': {
        id: 'skin-lore-25',
        number: '087',
        title: 'Theater Lobby Crisis',
        category: 'serpent',
        content: `COMPLAINT FORM

Name: Other Concessions
Issue: Colonel Kernel's Pretentiousness

"He keeps quoting indie films no one's heard of," complains Nachos. "Yesterday he called popcorn 'the people's caviar.' What does that even mean?"

Colonel Kernel's Response: "You wouldn't understand. It's a metaphor for the human condition. Also, I'm butter-forward, not buttery. There's a difference."

Resolution: Pending (Kernel now doing one-snack show about his journey)`,
        unlockCriteria: { type: 'playTime', value: 120 },
        unlockText: 'Play for 2 hours total'
    },

    'skin-lore-26': {
        id: 'skin-lore-26',
        number: '088',
        title: 'Dragon Resources Department',
        category: 'serpent',
        content: `REALM OF DRAGONS HR MEMO

Re: Ralph's Integration Issues

Ralph has applied for "family game night" 47 times. Fire damage remains issue.

"I just want to play Monopoly," Ralph pleaded, somehow setting the suggestion box ablaze. "I promise I won't burn the hotels this time."

Other dragons' response: "He's trying too hard to be casual. Yesterday he brought potato salad to the hoard meeting."

Recommendation: Approve with asbestos precautions.`,
        unlockCriteria: { type: 'daysPlayed', value: 14 },
        unlockText: 'Play on 14 different days'
    },

    'skin-lore-27': {
        id: 'skin-lore-27',
        number: '089',
        title: 'Environmental Impact Study',
        category: 'serpent',
        content: `ECO-DRAGON INITIATIVE
Final Report

Subject: World Muncher
Status: Mostly Vegan (weekends excluded)

Findings:
- Monday-Friday: Sustainable kelp and ethically sourced minerals
- Weekends: "What happens on cheat day stays on cheat day"
- Carbon Footprint: Negative (literally eating carbon)

Conclusion: Being eco-friendly dragon is hard when villages look so delicious.

Note: Three villages consumed during study. Researchers included.`,
        unlockCriteria: { type: 'voidOrbs', value: 250 },
        unlockText: 'Eat 250 void orbs'
    },

    'skin-lore-28': {
        id: 'skin-lore-28',
        number: '090',
        title: 'Cryptid Dating Profile',
        category: 'serpent',
        content: `💀 CRYPTIDFINDER 💀

Eldritch Horror, Eternal, It/That/Which Should Not Be

LOOKING FOR: Someone who gets that "Ph'nglui mglw'nafh" is just me asking for coffee

INTERESTS:
- Long slumbers in R'lyeh
- Driving mortals mad (as a hobby)
- Seafood
- True crime podcasts

IDEAL DATE: Netflix and consuming the sanity of mankind

Deal-breakers: People who wake me up before my eon is over

Bio: "Not a morning person. Or an evening person. Time is an illusion, but so is my dating life."`,
        unlockCriteria: { type: 'voidOrbs', value: 1000 },
        unlockText: 'Eat 1,000 void orbs'
    },

    'skin-lore-29': {
        id: 'skin-lore-29',
        number: '091',
        title: 'Infinity Warranty Card',
        category: 'serpent',
        content: `GAUNTLET WARRANTY REGISTRATION

Product: Snappy (Infinity Gauntlet Deluxe)
Stones: All collected
Warranty: Void if used for universe-altering snaps

Customer Comment: "Collected all stones just to make the one joke. Worth it. Everyone saw it coming. Still worth it."

Terms & Conditions:
- Not responsible for existential consequences
- 50% failure rate is feature, not bug
- Dust cleanup not included

Technical Support: "Have you tried turning the universe off and on again?"`,
        unlockCriteria: { type: 'collectExotics', value: 5 },
        unlockText: 'Collect all other exotic skins'
    },

    'skin-lore-30': {
        id: 'skin-lore-30',
        number: '092',
        title: 'Silicon Valley Pitch Deck',
        category: 'serpent',
        content: `DISRUPTIVE VENTURES LLC

Presenter: Tres Commas
Company: Whatever You Want Baby
Valuation: Three Commas (Obviously)

THE PITCH:
"Imagine Uber but for existing"
"It's like Netflix but for consciousness"
"Think Amazon but for the void"

Investor Questions:
Q: "What's your revenue model?"
A: "Revenue is for people with only two commas"

*Doors do this* \\o/ *not this* |o|

Status: Funded. No one knows why.`,
        unlockCriteria: { type: 'totalScore', value: 1000000000 },
        unlockText: 'Score 1 billion total points'
    },

    'skin-lore-31': {
        id: 'skin-lore-31',
        number: '093',
        title: 'The Four Seals',
        category: 'serpent',
        content: `FROM THE BOOK OF BOSS BATTLES

And when the Snake had consumed enough, the Seals were broken:

FIRST SEAL - OSSEUS OF EARTH
"Bones remember what flesh forgets"

SECOND SEAL - PYRAXIS OF FLAME  
"Anger given form, form given hunger"

THIRD SEAL - ABYSSOS OF DEPTHS
"The deep calls to deep, and both are famished"

FOURTH SEAL - ZEPHYRUS OF WINDS
"Motion without purpose, purpose without end"

Each seal broken grants the breaker their essence. Each essence corrupts the bearer. The Snake laughs at this irony.`,
        unlockCriteria: { type: 'defeatBoss', boss: 'any', count: 4 },
        unlockText: 'Defeat all four bosses'
    }
};