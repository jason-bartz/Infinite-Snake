// Skin Data Structure with Rarity Tiers and Unlock Criteria
const skinData = {
    // COMMON (15 skins including default)
    'snake-default-green': {
        name: 'Basic Boy',
        rarity: 'common',
        bio: 'Factory settings personified, living proof that sometimes vanilla is a choice, not a personality. Still waiting for that custom update that everyone else already got.',
        unlockCriteria: {
            type: 'default',
            value: 0,
            description: 'Default skin - always unlocked'
        }
    },
    'hot-head': {
        name: 'Hot Head',
        rarity: 'common',
        bio: 'Born from the eternal flame of rage quitting, this fiery bro burns brightest when losing.',
        unlockCriteria: {
            type: 'deaths',
            value: 10,
            description: 'Die 10 times'
        }
    },
    'good-boy': {
        name: 'Good Boy',
        rarity: 'common',
        bio: 'Four paws, zero thoughts, maximum loyalty.',
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 5,
            description: 'Play 5 games'
        }
    },
    'lil-beans': {
        name: 'Lil Beans',
        rarity: 'common',
        bio: 'Professional nap enthusiast found on a keyboard near you.',
        unlockCriteria: {
            type: 'default',
            value: 0,
            description: 'Play the Infinite Snake Preview'
        }
    },
    'spout': {
        name: 'Spout',
        rarity: 'common',
        bio: 'Just a whale having a whale of a good time.',
        unlockCriteria: {
            type: 'discoveries',
            value: 50,
            description: 'Make 50 discoveries'
        }
    },
    'ansel-35': {
        name: 'Ansel 35',
        rarity: 'common',
        bio: 'Vintage shooter who captures every golden hour moment.',
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 20,
            description: 'Play 20 games'
        }
    },
    'time-out': {
        name: 'Time-Out',
        rarity: 'common',
        bio: "Always running late but somehow still has time to remind everyone else they're behind schedule.",
        unlockCriteria: {
            type: 'playTime',
            value: 30,
            description: 'Play for 30 total minutes'
        }
    },
    'boat-mcboatface': {
        name: 'Boat McBoatface',
        rarity: 'common',
        bio: "Democracy's greatest achievement, now floating through the waters of the cosmos.",
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 10,
            description: 'Play 10 games'
        }
    },
    'speed-demon-jr': {
        name: 'Speed Demon Jr.',
        rarity: 'common',
        bio: 'Fueled by juice boxes, chicken nuggies, and too much screentime.',
        unlockCriteria: {
            type: 'timeWindow',
            startHour: 20,
            endHour: 22,
            description: 'Play between 8-10 PM'
        }
    },
    'speed-demon': {
        name: 'Speed Demon',
        rarity: 'common',
        bio: 'Left turns only, sponsorship deals pending. Praise Dale.',
        unlockCriteria: {
            type: 'scoreInGame',
            value: 100000,
            description: 'Reach 100k score in a single game'
        }
    },
    'world-traveler': {
        name: 'World Traveler',
        rarity: 'common',
        bio: 'Been everywhere, seen everything, guards your tomato plants.',
        unlockCriteria: {
            type: 'daysPlayed',
            value: 7,
            description: 'Play on 7 different days'
        }
    },
    'bo-kay': {
        name: 'Bo Kay',
        rarity: 'common',
        bio: 'Fresh from the grocery store flower section, wilting under pressure since day one.',
        unlockCriteria: {
            type: 'dieEarly',
            value: 1,
            description: 'Die within first 30 seconds of a game'
        }
    },
    'the-special': {
        name: 'The Special',
        rarity: 'common',
        bio: "Everything is awesome when you're made of plastic and getting stepped on hurts people more than you.",
        unlockCriteria: {
            type: 'firstPlace',
            value: 10,
            description: 'Achieve 1st place in a game, 10 times'
        }
    },
    'ruby': {
        name: 'Ruby',
        rarity: 'common',
        bio: 'The cheeriest apple in the orchard who believes a smile a day keeps the chaos demons away.',
        unlockCriteria: {
            type: 'default',
            value: 0,
            description: 'Default skin - always unlocked'
        }
    },
    'chirpy': {
        name: 'Chirpy',
        rarity: 'common',
        bio: "A small blue bird who tweets the morning news to anyone who'll listen.",
        unlockCriteria: {
            type: 'default',
            value: 0,
            description: 'Default skin - always unlocked'
        }
    },

    // UNCOMMON (9 skins)
    'poddington': {
        name: 'Poddington',
        rarity: 'uncommon',
        bio: '1,000 songs in your pocket. Rubbing his belly brings good luck.',
        unlockCriteria: {
            type: 'playTime',
            value: 1000,
            description: 'Play 1,000 total minutes'
        }
    },
    'crt-surfer': {
        name: 'CRT Surfer',
        rarity: 'uncommon',
        bio: 'Static personality, weighs a ton, totally tubular.',
        unlockCriteria: {
            type: 'scoreInGame',
            value: 250000,
            description: 'Score 250k total points'
        }
    },
    'murica': {
        name: "'Murica",
        rarity: 'uncommon',
        bio: 'Freedom intensifies with every combo, bald eagles optional but strongly encouraged.',
        unlockCriteria: {
            type: 'kills',
            value: 50,
            description: 'Get 50 kills'
        }
    },
    'whirlwind': {
        name: 'Whirlwind',
        rarity: 'uncommon',
        bio: "Touched down just to mess up everyone's hair.",
        unlockCriteria: {
            type: 'killsInGame',
            value: 20,
            description: 'Get 20 kills in one game'
        }
    },
    'mvp': {
        name: 'MVP',
        rarity: 'uncommon',
        bio: 'Spent more time learning the griddy than actually learning to throw.',
        unlockCriteria: {
            type: 'firstPlace',
            value: 20,
            description: 'Achieve 1st place in a game, 20 times'
        }
    },
    'margot': {
        name: 'Margot',
        rarity: 'uncommon',
        bio: "Life in plastic is fantastic, especially when you're carrying Ken's emotional baggage.",
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 50,
            description: 'Play 50 games'
        }
    },
    'caffeine-fiend': {
        name: 'Caffeine Fiend',
        rarity: 'uncommon',
        bio: 'Triple shot, no foam, definitely judging your basic order.',
        unlockCriteria: {
            type: 'timeWindow',
            startHour: 5,
            endHour: 8,
            description: 'Play between 5-8 AM'
        }
    },
    'cola-crusader': {
        name: 'Cola Crusader',
        rarity: 'uncommon',
        bio: 'Zero calories, zero sugar, zero chill.',
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 100,
            description: 'Play 100 games'
        }
    },
    'sir-dips-a-lot': {
        name: 'Sir Dips-a-lot',
        rarity: 'uncommon',
        bio: 'Crispy on the outside, fluffy on the inside, always a little salty.',
        unlockCriteria: {
            type: 'voidOrbs',
            value: 100,
            description: 'Eat 100 void orbs'
        }
    },
    'sir-whirl': {
        name: 'Sir Whirl',
        rarity: 'uncommon',
        bio: 'The sweetest ice cream cone around who melts hearts faster than summer heat.',
        unlockCriteria: {
            type: 'catalystGems',
            value: 100,
            description: 'Collect 100 catalyst gems total'
        }
    },
    'colonel-kernel': {
        name: 'Colonel Kernel',
        rarity: 'uncommon',
        bio: 'A theater major with a buttery smooth smile and always quoting his favorite indie-comedy.',
        unlockCriteria: {
            type: 'playTime',
            value: 120,
            description: 'Play for 2 hours total'
        }
    },
    'scuffy': {
        name: 'Scuffy',
        rarity: 'uncommon',
        bio: 'A crisp, red and white street legend worn by presidents and pretenders alike. Started from the box now we here.',
        unlockCriteria: {
            type: 'modeGames',
            mode: 'cozy',
            value: 50,
            description: 'Play 50 Cozy games'
        }
    },

    // RARE (10 skins)
    'the-resistance': {
        name: 'The Resistance',
        rarity: 'rare',
        bio: "Recording everything for the 'gram while defending the Earth.",
        unlockCriteria: {
            type: 'discoveries',
            value: 200,
            description: 'Make 200 total discoveries'
        }
    },
    'world-muncher': {
        name: 'World Muncher',
        rarity: 'rare',
        bio: "Eco-friendly dragon who's vegan on the weekends.",
        unlockCriteria: {
            type: 'voidOrbs',
            value: 250,
            description: 'Eat 250 void orbs'
        }
    },
    'ralph': {
        name: 'Ralph',
        rarity: 'rare',
        bio: 'Just wants to be included in family game night without setting the board on fire.',
        unlockCriteria: {
            type: 'daysPlayed',
            value: 14,
            description: 'Play on 14 different days'
        }
    },
    'ice-dragon': {
        name: 'Ice Dragon',
        rarity: 'rare',
        bio: 'Coolest serpent at the bar, literally, please stop asking him to chill your drinks. Thanks.',
        unlockCriteria: {
            type: 'killsWithoutDying',
            value: 50,
            description: 'Get 50 kills without dying in one game'
        }
    },
    'spud-bud': {
        name: 'Spud Bud',
        rarity: 'rare',
        bio: 'Lost his original parts years ago but somehow is keeping it together.',
        unlockCriteria: {
            type: 'deaths',
            value: 100,
            description: 'Die 100 times total'
        }
    },
    'big-dawg': {
        name: 'Big Dawg',
        rarity: 'rare',
        bio: "Ballpark glizzy-legend who's been relishing victory since the seventh inning stretch.",
        unlockCriteria: {
            type: 'scoreInGame',
            value: 500000,
            description: 'Score 500k in one game'
        }
    },
    'tony-pep': {
        name: 'Tony Pep',
        rarity: 'rare',
        bio: 'Third generation pizzaiolo elitist who insists pineapple belongs nowhere near his crust.',
        unlockCriteria: {
            type: 'catalystGems',
            value: 250,
            description: 'Eat 250 catalyst gems'
        }
    },
    'sprinkles': {
        name: 'Sprinkles',
        rarity: 'rare',
        bio: 'Sweet facade hiding the existential dread of having a hole where its soul should be.',
        unlockCriteria: {
            type: 'totalScore',
            value: 1000000,
            description: 'Score 1 million total points'
        }
    },
    'noodle-master': {
        name: 'Noodle Master',
        rarity: 'rare',
        bio: 'Loves being slurped, a little too much. Kinda weird actually.',
        unlockCriteria: {
            type: 'kills',
            value: 250,
            description: 'Get 250 total kills'
        }
    },
    'little-bro': {
        name: 'Little Bro',
        rarity: 'rare',
        bio: 'Unplugged controller specialist who\'s been "playing" since before he could walk.',
        unlockCriteria: {
            type: 'gamesPlayedDuringMonths',
            value: 25,
            startMonth: 5, // June (0-indexed)
            endMonth: 7,   // August
            description: 'Play 25 games during summer vacation (June-August)'
        }
    },

    // LEGENDARY (7 skins)
    'mr-swirley': {
        name: 'Mr. Swirley',
        rarity: 'legendary',
        bio: 'Flushed with success after going viral. Sworn enemy of The Resistance.',
        unlockCriteria: {
            type: 'deaths',
            value: 250,
            description: 'Die 250 times'
        }
    },
    'franklin': {
        name: 'Franklin',
        rarity: 'legendary',
        bio: 'Stitched together from spare parts and dad jokes, still looking for someone who "gets" him.',
        unlockCriteria: {
            type: 'daysPlayed',
            value: 30,
            description: 'Play on 30 different days'
        }
    },
    'ring-leader': {
        name: 'Ring Leader',
        rarity: 'legendary',
        bio: 'Seventh rock from the sun, showing off her curves and bling since 1610.',
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 365,
            description: 'Play 365 games'
        }
    },
    'cosmic-ray': {
        name: 'Cosmic Ray',
        rarity: 'legendary',
        bio: 'One small step for monkey, one giant leap closer to Planet of the Apes.',
        unlockCriteria: {
            type: 'catalystGems',
            value: 500,
            description: 'Eat 500 catalyst gems'
        }
    },
    'billy-blue': {
        name: 'Billy Blue',
        rarity: 'legendary',
        bio: "Buffalo's finest export. Ranch is for losers yah dyngus.",
        unlockCriteria: {
            type: 'kills',
            value: 500,
            description: 'Get 500 total kills'
        }
    },
    'metal-boi': {
        name: 'Metal Boi',
        rarity: 'legendary',
        bio: 'Beep boop means "I love you" in his language. (Probably).',
        unlockCriteria: {
            type: 'totalScore',
            value: 5000000,
            description: 'Score 5 million total points'
        }
    },
    'ho-ho-hose': {
        name: 'Ho Ho Hose',
        rarity: 'legendary',
        bio: "Knows if you've been naughty or nice, mostly naughty based on your search history.",
        unlockCriteria: {
            type: 'monthWindow',
            startMonth: 11, // December (0-indexed)
            endMonth: 11,
            description: 'Play during December'
        }
    },
    'pixel': {
        name: 'Pixel',
        rarity: 'legendary',
        bio: 'A misunderstood monster who just wants a hug but tends to surprise people.',
        unlockCriteria: {
            type: 'scoreInGame',
            value: 250000,
            description: 'Score 250,000 points in a single classic mode game'
        }
    },

    // EXOTIC (8 skins)
    'woz': {
        name: 'Woz',
        rarity: 'exotic',
        bio: 'Built in a Palo Alto garage with box of SCRAPS.',
        unlockCriteria: {
            type: 'discoveries',
            value: 500,
            description: 'Make 500 total discoveries'
        }
    },
    'the-pocketeer': {
        name: 'The Pocketeer',
        rarity: 'exotic',
        bio: 'Road trip and bedtime hero of yesteryear. Squiggly worm light not included.',
        unlockCriteria: {
            type: 'gamesPlayed',
            value: 500,
            description: 'Play 500 games'
        }
    },
    'tres-commas': {
        name: 'Tres Commas',
        rarity: 'exotic',
        bio: 'Venture capital fever dream, his doors go like this: *hand gestures*',
        unlockCriteria: {
            type: 'totalScore',
            value: 1000000000,
            description: 'Score 1 billion total points'
        }
    },
    'pastry-cat': {
        name: 'Pastry Cat',
        rarity: 'exotic',
        bio: "Powered by dubstep, Pop-Tarts, and recycled 2010's memes.",
        unlockCriteria: {
            type: 'monthlyLeaderboard',
            value: 3,
            description: 'Achieve first place on the monthly leaderboard, on three different months'
        }
    },
    'snappy': {
        name: 'Snappy',
        rarity: 'exotic',
        bio: 'Collected all the stones just to make that one joke everyone saw coming.',
        unlockCriteria: {
            type: 'collectExotics',
            value: 5, // All other exotic skins
            description: 'Collect all other exotic skins'
        }
    },
    'eldritch-horror': {
        name: 'Eldritch Horror',
        rarity: 'exotic',
        bio: 'Ph\'nglui mglw\'nafh wgah\'nagl fhtagn, which roughly translates to "Go away, I\'m just trying to sleep."',
        unlockCriteria: {
            type: 'voidOrbs',
            value: 1000,
            description: 'Eat 1,000 void orbs'
        }
    },
    'midnight': {
        name: 'Midnight',
        rarity: 'exotic',
        bio: 'A mysterious companion who channels dark magic through the pentagram on their forehead.',
        unlockCriteria: {
            type: 'timeWindow',
            startHour: 0,
            endHour: 3,
            gamesRequired: 13,
            description: 'Play 13 games between midnight and 3 AM'
        }
    },

    // SECRET (4 skins - Boss skins)
    'abyssos': {
        name: 'Abyssos',
        rarity: 'secret',
        isBoss: true,
        bio: 'Emerged from depths unknown, bringing darkness and pretty good seafood.',
        unlockCriteria: {
            type: 'defeatBoss',
            boss: 'abyssos',
            description: 'Defeat Abyssos'
        }
    },
    'osseus': {
        name: 'Osseus',
        rarity: 'secret',
        isBoss: true,
        bio: 'Ancient bones rattling with secrets, calcium supplements highly recommended.',
        unlockCriteria: {
            type: 'defeatBoss',
            boss: 'osseus',
            description: 'Defeat Osseus'
        }
    },
    'pyraxis': {
        name: 'Pyraxis',
        rarity: 'secret',
        isBoss: true,
        bio: 'Burns with the intensity of a thousand suns, in search of a good aluminum-free antiperspirant.',
        unlockCriteria: {
            type: 'defeatBoss',
            boss: 'pyraxis',
            description: 'Defeat Pyraxis'
        }
    },
    'zephyrus': {
        name: 'Zephyrus',
        rarity: 'secret',
        isBoss: true,
        bio: 'Whispers on the wind speak of the void, or maybe that\'s just the sound of everyone gossiping about you.',
        unlockCriteria: {
            type: 'defeatBoss',
            boss: 'zephyrus',
            description: 'Defeat Zephyrus'
        }
    }
};

// Rarity configuration
const rarityConfig = {
    common: {
        color: '#808080',
        borderColor: '#808080',
        glowColor: 'rgba(128, 128, 128, 0.5)',
        particleCount: 0
    },
    uncommon: {
        color: '#2ecc71',
        borderColor: '#2ecc71',
        glowColor: 'rgba(46, 204, 113, 0.5)',
        particleCount: 1
    },
    rare: {
        color: '#3498db',
        borderColor: '#3498db',
        glowColor: 'rgba(52, 152, 219, 0.5)',
        particleCount: 2
    },
    legendary: {
        color: '#9b59b6',
        borderColor: '#9b59b6',
        glowColor: 'rgba(155, 89, 182, 0.5)',
        particleCount: 3
    },
    exotic: {
        color: '#ff8c00',
        borderColor: '#ff8c00',
        glowColor: 'rgba(255, 140, 0, 0.5)',
        particleCount: 4
    },
    secret: {
        color: '#e74c3c',
        borderColor: '#e74c3c',
        glowColor: 'rgba(231, 76, 60, 0.5)',
        particleCount: 5
    }
};

// Export to window for global access
window.SKIN_DATA = skinData;
window.RARITY_CONFIG = rarityConfig;