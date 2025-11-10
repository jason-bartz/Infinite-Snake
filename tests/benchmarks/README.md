# Rendering Performance Benchmarks

**Purpose**: Measure and compare rendering performance between the old monolithic system and the new ECS-based RenderingSystem.

**Last Updated**: 2025-11-10

---

## 🎯 Quick Start

### Browser Testing (Recommended)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the benchmark page:**
   ```
   http://localhost:5173/tests/benchmarks/benchmark.html
   ```

3. **Click "Run Benchmark"** and wait for results (1-2 minutes)

4. **Export results** as JSON for documentation

---

## 📊 What Gets Measured

### Core Metrics
- **FPS (Frames Per Second)**: Average, min, max
- **Frame Time**: Average, p95, p99, worst-case
- **Canvas Draw Calls**: Total draw operations per frame
- **Memory Usage**: Heap size before/after, delta
- **Layer Times**: Time spent rendering each layer (new system only)

### Complexity Levels
| Level | Snakes | Elements | Particles | Use Case |
|-------|--------|----------|-----------|----------|
| Low | 2 | 20 | 50 | Early game, mobile |
| Medium | 5 | 50 | 200 | Mid game, typical |
| High | 10 | 100 | 500 | Late game, busy |
| Extreme | 20 | 200 | 1000 | Stress test |

---

## 🔍 How It Works

### Old System (Simulated)
The benchmark simulates the rendering approach from `game-original.js`:
- ❌ No viewport culling
- ❌ No batching optimizations
- ❌ Expensive shadow/glow effects per frame
- ❌ All entities rendered every frame
- ❌ Redundant state changes

### New System (RenderingSystem)
Uses the modern ECS-based rendering pipeline:
- ✅ Viewport culling with entity-specific margins
- ✅ Layer-based rendering order
- ✅ Batch rendering where possible
- ✅ Object pooling for particles
- ✅ Optimized state management
- ✅ Performance metrics tracking
- ✅ Error recovery and renderer disabling

---

## 📈 Expected Results

### Performance Targets
- **FPS**: 60 FPS minimum on desktop, 30+ FPS on mobile
- **Frame Time**: <16.67ms (60 FPS), <33.33ms (30 FPS)
- **Draw Call Reduction**: 20-40% fewer than old system
- **Memory**: Stable or improved (no leaks)

### Success Criteria
- ✅ New system matches or exceeds old system FPS
- ✅ Frame time p99 < 20ms
- ✅ Draw calls reduced by 20%+
- ✅ Memory usage stable across test duration
- ✅ All renderers working correctly

---

## 🧪 Running Benchmarks

### Browser (Visual)
```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:5173/tests/benchmarks/benchmark.html

# Select options:
# - Complexity: medium (default)
# - Frames: 300 (default)

# Click "Run Benchmark"
```

### Console Output
The benchmark will output detailed console logs:
```
🚀 Starting rendering performance benchmark (complexity: medium)...
⏳ Benchmarking old system (simulated)...
✅ Old system benchmark complete
⏳ Benchmarking new RenderingSystem...
✅ New system benchmark complete

═══════════════════════════════════════════════════════
         RENDERING PERFORMANCE BENCHMARK REPORT
═══════════════════════════════════════════════════════

📊 FRAME RATE PERFORMANCE
─────────────────────────────────────────────────────
Average FPS:     🟢 +25.5% (45.20 → 56.73)
Min FPS:         🟢 +18.2% (38.50 → 45.51)
Max FPS:         🟢 +15.8% (52.30 → 60.57)

⏱️  FRAME TIME (ms)
─────────────────────────────────────────────────────
Average:         🟢 -20.3% (22.12 → 17.63)
95th Percentile: 🟢 -18.5% (25.97 → 21.16)
99th Percentile: 🟢 -16.2% (28.44 → 23.83)
Worst Frame:     🟢 -12.8% (32.50 → 28.34)

🎨 CANVAS DRAW CALLS
─────────────────────────────────────────────────────
Average:         🟢 -35.2% (450.23 → 291.87)
Min:             🟢 -32.1% (420.00 → 285.12)
Max:             🟢 -28.5% (490.00 → 350.23)

🏗️  RENDER TIME BY LAYER (New System Only)
─────────────────────────────────────────────────────
BACKGROUND           2.34ms (2.10-2.85ms)
BORDERS              0.45ms (0.38-0.62ms)
SNAKES               8.23ms (7.45-9.12ms)
GAME_OBJECTS         3.12ms (2.88-3.45ms)
PARTICLES            2.89ms (2.45-3.32ms)

💾 MEMORY USAGE
─────────────────────────────────────────────────────
Initial (MB):    Old: 45.23 | New: 43.12
Final (MB):      Old: 48.56 | New: 45.89
Delta (MB):      🟢 -24.5% (3.33 → 2.77)

📈 SUMMARY
─────────────────────────────────────────────────────
Total Frames:    300

🎯 KEY IMPROVEMENTS:
✅ FPS increased by 25.5%
✅ Frame time reduced by 20.3%
✅ Draw calls reduced by 35.2%

═══════════════════════════════════════════════════════
```

---

## 📁 File Structure

```
tests/benchmarks/
├── README.md                    ← This file
├── benchmark.html               ← Browser-based benchmark runner
├── rendering-benchmark.js       ← Core benchmark logic
└── results/                     ← Benchmark results (create this folder)
    ├── 2025-11-10-medium.json  ← Example result
    └── comparison-chart.png     ← Visual comparison
```

---

## 💾 Exporting Results

### Browser Export
1. Run benchmark in browser
2. Click "Export Results" button
3. Save JSON file to `tests/benchmarks/results/`

### Result Format
```json
{
  "timestamp": "2025-11-10T15:30:00.000Z",
  "complexity": "medium",
  "frames": 300,
  "userAgent": "Mozilla/5.0...",
  "results": {
    "old": { /* old system stats */ },
    "new": { /* new system stats */ },
    "report": "Full text report..."
  }
}
```

---

## 🔬 Advanced Usage

### Custom Complexity
Edit the complexity configuration in `rendering-benchmark.js`:

```javascript
const complexityConfig = {
  custom: { snakes: 15, elements: 150, particles: 750 },
};
```

### Testing Specific Renderers
Modify the benchmark to test individual renderers:

```javascript
import { BackgroundRenderer } from '../../src/systems/renderers/BackgroundRenderer.js';

// Test background only
const renderer = new BackgroundRenderer();
// ... benchmark code
```

### Profiling with DevTools
1. Open Chrome DevTools
2. Go to Performance tab
3. Click record
4. Run benchmark
5. Stop recording
6. Analyze flame graph for bottlenecks

---

## 🐛 Troubleshooting

### Low FPS in Benchmark
- Close other browser tabs
- Disable browser extensions
- Check CPU/GPU usage
- Try lower complexity level

### Memory Warnings
This is expected - we're stress testing. If memory keeps growing:
- Check for leaks in renderers
- Verify object pooling is working
- Review canvas state management

### Benchmark Crashes
- Reduce complexity level
- Reduce frame count
- Check browser console for errors
- Verify all dependencies are loaded

---

## 📊 Interpreting Results

### Green Metrics (Good)
- FPS increase: New system is faster
- Frame time decrease: More efficient rendering
- Draw call reduction: Better batching/culling
- Memory delta decrease: Better memory management

### Red Metrics (Needs Investigation)
- FPS decrease: Performance regression
- Frame time increase: Rendering slower
- Draw call increase: Missing optimizations
- Memory increase: Potential leak

### What to Look For
1. **Consistent FPS**: Should stay near 60 FPS on desktop
2. **Low p99 frame time**: <20ms for smooth gameplay
3. **Reduced draw calls**: Should be 20-40% lower
4. **Stable memory**: Delta should be minimal
5. **Layer balance**: No single layer dominating render time

---

## 🎯 Next Steps

After benchmarking:

1. **Document Results**: Add to [REFACTORING_PROGRESS.md](../../REFACTORING_PROGRESS.md)
2. **Compare Against Baseline**: Target ≥60 FPS on desktop, ≥30 FPS on mobile
3. **Identify Bottlenecks**: Use layer times to find slow renderers
4. **Optimize If Needed**: Focus on highest layer times
5. **Test in Real Game**: Integrate with game loop and test with actual gameplay

---

## 📚 Related Documentation

- [RENDERING_ANALYSIS.md](../../RENDERING_ANALYSIS.md) - Detailed rendering system analysis
- [RenderingSystem.js](../../src/systems/RenderingSystem.js) - Main rendering coordinator
- [REFACTORING_PROGRESS.md](../../REFACTORING_PROGRESS.md) - Phase 3 progress tracker
- [START_HERE.md](../../START_HERE.md) - Project overview

---

## 🔍 Benchmark Implementation Details

### Warm-up Phase
The first 60 frames are discarded to allow:
- JIT compilation to optimize hot paths
- Garbage collector to stabilize
- Caches to warm up

### Frame Counting
- Uses `performance.now()` for high-resolution timing
- Records every frame individually
- Calculates percentiles from full dataset

### Canvas Call Counting
Wraps canvas context methods to count:
- Drawing operations: `fillRect`, `strokeRect`, `drawImage`
- Path operations: `beginPath`, `stroke`, `fill`, `arc`
- Text operations: `fillText`, `strokeText`

### Memory Tracking
Uses `performance.memory` API (Chrome/Edge only):
- Records snapshots at 0%, 50%, 100% progress
- Calculates delta to detect leaks
- Converts to MB for readability

---

## ✅ Success Criteria for Phase 3

Based on benchmark results, Phase 3 is complete when:
- ✅ All 893 tests passing (100%)
- ✅ Benchmark shows equal or better performance
- ✅ FPS meets targets (60 FPS desktop, 30+ mobile)
- ✅ Draw calls reduced by 20%+
- ✅ Memory usage stable
- ✅ Integration with game loop successful

---

**Last Updated**: 2025-11-10
**Phase**: 3 (Systems Extraction - RenderingSystem)
**Status**: 🟢 Ready for benchmarking
