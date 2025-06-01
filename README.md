# Infinite Snake

An infinite snake game with elemental combination mechanics. Collect elements and combine them within your snake's body to discover new elements and unlock special powers.

## Features

- **Elemental System**: Start with Fire, Water, Earth, and Air
- **Thousands of Combinations**: Discover over 30,000 unique element combinations
- **Power-ups**: Unlock special abilities like speed boosts, armor, and magnetic attraction
- **Multiplayer AI**: Compete against AI snakes in a vast world
- **Discovery Tracking**: Track your progress as you uncover new elements
- **Multiple Game Modes**: Choose from different victory conditions or play infinitely

## How to Play

- **Arrow Keys**: Control your snake's movement
- **P**: Pause the game
- Collect elements scattered across the world
- Elements in your snake's body will automatically combine when compatible
- Discover new elements to earn points and unlock powers
- Grow your snake and survive as long as possible

## Deployment

This game is designed to be deployed on Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy.

## Live Demo

Visit [infinitesnake.io](https://infinitesnake.io) to play!

## Music

The game supports background music that cycles randomly through multiple tracks. To add your own music:

1. Place MP3 files in the `music/` directory
2. Name them `track1.mp3`, `track2.mp3`, etc.
3. Or update the `musicTracks` array in `index.html`

### Music Controls

- **M**: Toggle music on/off
- **Volume Slider**: Adjust music volume (bottom-left corner)
- Default volume is set to 30%

### Adding Custom Music

To use your own music files with different names:

1. Open `index.html`
2. Find the `musicTracks` array
3. Update the filenames to match your MP3 files:

```javascript
const musicTracks = [
    'music/your-song-1.mp3',
    'music/your-song-2.mp3',
    'music/your-song-3.mp3'
];
```

## Credits

Game developed with elemental combination mechanics inspired by various crafting games.

### Music Credits

*Add your music credits here when you add tracks*