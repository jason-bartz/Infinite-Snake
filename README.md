# 🐍 Infinite Snake

[![Play Now](https://img.shields.io/badge/Play-Now-brightgreen?style=for-the-badge)](https://infinitesnake.com)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

## 🎮 Game Overview

**Infinite Snake** merges the timeless gameplay of Snake with the addictive discovery mechanics of element-crafting and alchemy games. Starting with just four basic elements—Earth, Water, Air, and Fire—embark on a journey to uncover tens of thousands of unique combinations while competing against AI opponents and epic boss battles.

### 🌟 Key Features

- **🧪 Element Crafting System** - Combine elements within your snake's body to discover new ones
- **🤖 Dynamic AI Opponents** - Face off against snakes with distinct personalities and strategies  
- **👹 Epic Boss Battles** - Challenge four unique elemental bosses with special attacks
- **🏆 Global Leaderboard** - Compete for the highest score and most discoveries
- **🎨 60+ Unlockable Skins** - Customize your snake with themed skins earned through achievements
- **📱 Cross-Platform** - Seamless gameplay on desktop and mobile devices
- **🎵 Dynamic Soundtrack** - 10 background tracks and 20+ sound effects
- **⚡ Killstreak System** - Chain eliminations for epic announcements and medals

## 🎯 How to Play

### Controls
- **Desktop**: WASD or mouse movement
- **Mobile**: Virtual joystick touch controls

### Objective
1. Guide your snake to collect elemental orbs
2. Elements combine automatically inside your body when compatible
3. Discover new element combinations to increase your score
4. Eliminate opponent snakes by making them crash into you
5. Defeat bosses for massive points
6. Unlock new skins by completing achievements

### Quick Tips
- 💡 Keep elements in your body for combinations
- ⚡ Collect Catalyst Gems to spawn random elements
- 🛡️ You're invincible for 2 seconds after respawning

## 🔮 Game Mechanics

### Element System
- **Base Elements**: Earth (🌎), Water (💧), Air (💨), Fire (🔥)
- **Combinations**: Discover thousands of unique elements through experimentation
- **Visual Feedback**: Glowing effects indicate possible combinations

### AI Snake Opponent Personalities
1. **Aggressive** - High risk, high reward playstyle
2. **Balanced** - Strategic middle-ground approach  
3. **Combo Master** - Focuses on element discovery

## 💻 Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas
- **Rendering**: 2D Canvas API with WebGL acceleration
- **Backend**: Vercel hosting with Upstash Redis for leaderboards
- **Analytics**: Vercel Analytics
- **Audio**: Web Audio API
- **PWA**: Progressive Web App with offline support

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/infinite-snake.git
cd infinite-snake
```

2. Install dependencies
```bash
npm install
```

3. Start local server
```bash
npx http-server
```

4. Open your browser to `http://localhost:8080`

### Environment Variables

For leaderboard functionality, create a `.env` file:

```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## 🚀 Development

### Project Structure
```
infinite-snake/
├── index.html              # Main game file
├── js/
│   ├── core/              # Core game logic
│   │   ├── entities/      # Game objects (Snake, Boss, etc.)
│   │   └── systems/       # Game systems
│   ├── ui/                # User interface components
│   └── performance/       # Optimization modules
├── elements/              # Element data and combinations
├── assets/                # Game sprites and textures
├── music/                 # Background music tracks
├── sounds/                # Sound effects
└── api/                   # Backend endpoints
```

### Building for Production

```bash
# No build step required - pure JavaScript
# Deploy directly to Vercel or similar platform
vercel deploy
```

## 🌐 Browser Support (Tested)

- Chrome
- Safari
- Mobile Safari (iOS 14+) - Needs Further Optimization

## 🤝 Contributing

I welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Credits

- **Game Design & Development**: Jason Bartz
- **Sound Design**: Various Artists (see credits.html)
- **Special Thanks**: All our players and beta testers!

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Jason Bartz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.