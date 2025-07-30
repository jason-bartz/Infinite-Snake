/**
 * Name Generator for Infinite Snake
 * Generates random snake names and death messages
 */
class NameGenerator {
    constructor() {
        this.firstNames = [
            'Slithery', 'Noodles', 'Danger', 'Sneaky', 'Hissy', 'Wiggly', 'Sassy', 'Toxic', 
            'Fatal', 'Speedy', 'Turbo', 'Shadow', 'Cosmic', 'Rainbow', 'Golden', 'Spicy', 
            'Salty', 'Chunky', 'Professor', 'Star', 'Captain', 'Doctor', 'Master', 'Lord', 'Lady', 
            'Sir', 'General', 'Major', 'Colonel', 'Agent', 'Sergeant', 'Officer', 'Detective', 
            'Mighty', 'Tiny', 'Big', 'Little', 'Angry', 'Happy', 'Grumpy', 'Sleepy', 
            'Crazy', 'Lucky', 'Unlucky', 'Derpy', 'Snek', 'Elite', 'Royal', 'Noble', 'Ancient', 
            'Baby', 'Elder', 'Glizzy', 'Glizzard', 'Main', 'OG', 'Prime', 'Alpha', 'Beta', 
            'Omega', 'Max', 'Mini', 'Mega', 'Ultra', 'Hyper', 'Turbo', 'Elite', 
            'Legend', 'Master', 'King', 'Queen', 'Lord','Noodles'
        ];
        
        this.lastNames = [
            'McSnakeface', 'Noodleton', 'McNoodleton', 'Snakerson', 'Coilsworth', 'Fangs', 
            'Scales', 'Rattlebottom', 'Slithers', 'Hissington', 'Viperson', 'Cobrani', 
            'Python', 'Boopsmith', 'Noodleman', 'Serpentine', 'Snekkins', 'Tailsworth', 
            'Venomous', 'Strikerson', 'McBitey', 'McSnek', 'Swallows', 'Devourson', 'Munchkin', 
            'Chompers', 'von Hiss', 'von Rattle', 'de Coil', 'O\'Scales', 'McSlither', 'Snakewell', 
            'Benderson', 'Noodleboop', 'Voidsworth', 'Twistworth', 'Longbody', 'Shortfang', 'Quickstrike', 'Deadlyson', 
            'GlizzMeister'
        ];
        
        this.suffixes = [
            'Jr.', 'Sr.', 'III', 'IV', 'V', 'Esq.', 'PhD', 'M.D.', 'Boi', '420', 
            '69', '2000', '9000', 'XxX', '360', 'NoScope', 'YT', 'TTV', 'GG', 'EZ', 
            'Pro', 'Noob', 'God', 'Bot', 'UwU', 'OwO', 'Bruh', 'the Snake', 'the Serpent', 'the Noodle', 'the Danger', 'the Destroyer', 
            'the Devourer', 'the Mighty', 'the Terrible', 'the Great', 'the Lesser', 
            'the Unwise', 'the Bold', 'the Coward', 'the Brave', 'the Foolish', 'Junior', 'The Just'
        ];
        
        this.deathMessages = [
            'Skill Issue Detected',
            'You\'ve Been Snek\'d',
            'Oops! All Deaths',
            'Task Failed Successfully',
            'Connection to Life Lost',
            '404: Snake Not Found',
            'Rage Quit in 3... 2... 1...',
            'Press F to Pay Respects',
            'Uninstalling Life.exe',
            'Combo! You + Death = Failure',
            'Thanks for Playing (Badly)',
            'Achievement Unlocked: Death',
            'Have You Tried Not Dying?',
            'Speedrun to Death: Success!',
            'Slithered into Oblivion',
            'Maybe Play Another Game?',
            'Game Over, Space Snake',
            'Another One Bites the Dust',
            'Deleted from Reality',
            'Snake? Snake?! SNAAAAAAAAKE!',
            'Snake Down',
            'The Void Consumed You',
            'Life Expired',
            'Back to the Void',
            'Ded, LOL',
            'You Had One Job',
            'Big Ooof',
            'WASTED',
            'Hasta La Vista, Snakey',
            'End of the Line',
            'That\'s All, Folks',
            'The End... For Now'
        ];
    }
    
    generateRandomName() {
        const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
        
        // 70% chance to include suffix
        if (Math.random() < 0.7) {
            return `${firstName} ${lastName} ${suffix}`;
        } else {
            return `${firstName} ${lastName}`;
        }
    }
    
    getRandomDeathMessage() {
        return this.deathMessages[Math.floor(Math.random() * this.deathMessages.length)];
    }
}

// Export for global use
window.nameGenerator = new NameGenerator();