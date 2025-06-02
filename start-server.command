#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Infinite Snake server..."
echo "Open http://localhost:8000 in your browser"
echo "Press Ctrl+C to stop the server"
python3 -m http.server 8000