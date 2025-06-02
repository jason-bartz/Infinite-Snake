# How to Run Infinite Snake

The game requires a web server to run properly due to browser security restrictions (CORS policy).

## Quick Start (Easiest Method)

1. **Double-click** the `start-server.command` file in this folder
2. Your browser will open to http://localhost:8000
3. Click on `index.html` to play the game

## Alternative Method (Manual)

1. Open Terminal
2. Navigate to this folder:
   ```bash
   cd "/Users/jasonbartz/Documents/Development Projects/Infinite Snake"
   ```
3. Start the web server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open http://localhost:8000 in your browser
5. Click on `index.html` to play

## Troubleshooting

If you see "Failed to fetch" errors:
- Make sure you're running the game through a web server (not opening files directly)
- Check that all JSON files are present in the folder
- Try using a different port if 8000 is taken: `python3 -m http.server 8080`

## Testing

- Open `quick-test.html` through the web server to verify all databases load correctly
- Open `test-loading.html` for detailed loading information

## What's New

The game now uses an optimized chunk-based loading system:
- Starts with only essential elements (15KB vs 145KB)
- Loads additional content as you discover new elements
- All ~800 elements and ~1,400 combinations are preserved
- Better performance on slower connections