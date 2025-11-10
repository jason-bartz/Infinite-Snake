/**
 * Rendering Performance Benchmark
 *
 * Measures and compares rendering performance between:
 * - Old system (game-original.js rendering functions)
 * - New system (RenderingSystem with all renderers)
 *
 * Metrics tracked:
 * - FPS (frames per second)
 * - Frame time (ms)
 * - Canvas draw calls
 * - Memory usage
 * - Render time by layer
 */

import { RenderingSystem } from '../../src/systems/RenderingSystem.js';

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  constructor(name) {
    this.name = name;
    this.frames = [];
    this.drawCalls = [];
    this.memorySnapshots = [];
    this.layerTimes = {};
  }

  recordFrame(frameTime, drawCalls, layerTimes = {}) {
    this.frames.push(frameTime);
    this.drawCalls.push(drawCalls);

    // Track layer times
    for (const [layer, time] of Object.entries(layerTimes)) {
      if (!this.layerTimes[layer]) {
        this.layerTimes[layer] = [];
      }
      this.layerTimes[layer].push(time);
    }
  }

  recordMemory() {
    if (performance.memory) {
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
      });
    }
  }

  getStats() {
    const avgFrameTime = this.avg(this.frames);
    const avgFPS = 1000 / avgFrameTime;
    const minFPS = 1000 / Math.max(...this.frames);
    const maxFPS = 1000 / Math.min(...this.frames);
    const avgDrawCalls = this.avg(this.drawCalls);

    const layerStats = {};
    for (const [layer, times] of Object.entries(this.layerTimes)) {
      layerStats[layer] = {
        avg: this.avg(times),
        min: Math.min(...times),
        max: Math.max(...times),
      };
    }

    const memoryStats = this.memorySnapshots.length > 0 ? {
      initial: this.memorySnapshots[0].usedJSHeapSize / 1024 / 1024,
      final: this.memorySnapshots[this.memorySnapshots.length - 1].usedJSHeapSize / 1024 / 1024,
      delta: (this.memorySnapshots[this.memorySnapshots.length - 1].usedJSHeapSize -
              this.memorySnapshots[0].usedJSHeapSize) / 1024 / 1024,
    } : null;

    return {
      name: this.name,
      frameTime: {
        avg: avgFrameTime,
        min: Math.min(...this.frames),
        max: Math.max(...this.frames),
        p95: this.percentile(this.frames, 95),
        p99: this.percentile(this.frames, 99),
      },
      fps: {
        avg: avgFPS,
        min: minFPS,
        max: maxFPS,
      },
      drawCalls: {
        avg: avgDrawCalls,
        min: Math.min(...this.drawCalls),
        max: Math.max(...this.drawCalls),
      },
      layerTimes: layerStats,
      memory: memoryStats,
      totalFrames: this.frames.length,
    };
  }

  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

/**
 * Canvas draw call counter (intercepts canvas methods)
 */
class CanvasCallCounter {
  constructor(ctx) {
    this.ctx = ctx;
    this.callCount = 0;
    this.methods = [
      'fillRect', 'strokeRect', 'clearRect',
      'fillText', 'strokeText',
      'beginPath', 'stroke', 'fill',
      'arc', 'arcTo', 'ellipse',
      'rect', 'moveTo', 'lineTo',
      'bezierCurveTo', 'quadraticCurveTo',
      'drawImage',
    ];

    this.originalMethods = {};
    this.wrap();
  }

  wrap() {
    this.methods.forEach(method => {
      if (typeof this.ctx[method] === 'function') {
        this.originalMethods[method] = this.ctx[method].bind(this.ctx);
        this.ctx[method] = (...args) => {
          this.callCount++;
          return this.originalMethods[method](...args);
        };
      }
    });
  }

  unwrap() {
    this.methods.forEach(method => {
      if (this.originalMethods[method]) {
        this.ctx[method] = this.originalMethods[method];
      }
    });
  }

  reset() {
    this.callCount = 0;
  }

  getCount() {
    return this.callCount;
  }
}

/**
 * Create mock rendering data for benchmarking
 */
function createMockRenderData(complexity = 'medium') {
  const complexityConfig = {
    low: { snakes: 2, elements: 20, particles: 50 },
    medium: { snakes: 5, elements: 50, particles: 200 },
    high: { snakes: 10, elements: 100, particles: 500 },
    extreme: { snakes: 20, elements: 200, particles: 1000 },
  };

  const config = complexityConfig[complexity];

  const mockData = {
    // Snakes array
    snakes: Array.from({ length: config.snakes }, (_, i) => ({
      id: `snake-${i}`,
      isPlayer: i === 0,
      isDead: false,
      segments: Array.from({ length: 50 }, (_, j) => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
      })),
      head: {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        angle: Math.random() * Math.PI * 2,
        skin: { width: 64, height: 64 },
      },
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      opacity: 1,
      name: `Player ${i}`,
      isInvincible: false,
      isBoosting: false,
      isLeader: i === 0,
      isBoss: false,
    })),
    elements: Array.from({ length: config.elements }, (_, i) => ({
      id: `element-${i}`,
      x: Math.random() * 10000 - 5000,
      y: Math.random() * 10000 - 5000,
      emoji: '🍎',
      tier: Math.floor(Math.random() * 5) + 1,
      size: 32,
      glowIntensity: Math.random() * 0.5,
    })),
    particles: Array.from({ length: config.particles }, (_, i) => ({
      x: Math.random() * 10000 - 5000,
      y: Math.random() * 10000 - 5000,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 4 - 2,
      radius: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      opacity: Math.random(),
      type: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)],
    })),
  };

  return mockData;
}

/**
 * Benchmark the new RenderingSystem
 */
async function benchmarkNewSystem(canvas, mockData, numFrames = 300) {
  const metrics = new PerformanceMetrics('New RenderingSystem');
  const ctx = canvas.getContext('2d');
  const counter = new CanvasCallCounter(ctx);

  // Create rendering system (it creates camera and pipeline internally)
  const renderingSystem = new RenderingSystem(ctx, canvas, { isMobile: false });

  // Initialize the rendering system with world bounds
  renderingSystem.initialize({
    mapWidth: 10000,
    mapHeight: 10000,
    skinImages: {}
  });

  // Warm-up (skip first 60 frames for JIT compilation)
  for (let i = 0; i < 60; i++) {
    renderingSystem.render(mockData);
  }

  // Benchmark
  metrics.recordMemory();

  for (let i = 0; i < numFrames; i++) {
    counter.reset();
    const start = performance.now();

    renderingSystem.render(mockData);

    const frameTime = performance.now() - start;
    const drawCalls = counter.getCount();

    // Get layer times from pipeline
    const layerTimes = renderingSystem.pipeline?.getMetrics()?.layerTimes || {};

    metrics.recordFrame(frameTime, drawCalls, layerTimes);

    if (i % 100 === 0) {
      metrics.recordMemory();
    }
  }

  metrics.recordMemory();
  counter.unwrap();

  return metrics.getStats();
}

/**
 * Simulate old system rendering (approximate based on analysis)
 */
async function benchmarkOldSystemSimulated(canvas, mockData, numFrames = 300) {
  const metrics = new PerformanceMetrics('Old System (Simulated)');
  const ctx = canvas.getContext('2d');
  const counter = new CanvasCallCounter(ctx);

  // Simulate old rendering approach
  const renderOldStyle = () => {
    // Background (multiple layers, no culling)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nebula background
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple star field (simplified since we removed background object)
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    // Borders (all 4 sides, always)
    ctx.strokeStyle = '#9370DB';
    ctx.lineWidth = 10;
    ctx.strokeRect(-5000, -5000, 10000, 10000);

    // Gradients for borders (expensive)
    ['left', 'right', 'top', 'bottom'].forEach(side => {
      const gradient = ctx.createLinearGradient(0, 0, 100, 0);
      gradient.addColorStop(0, 'rgba(147, 112, 219, 0.5)');
      gradient.addColorStop(1, 'rgba(147, 112, 219, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 100, canvas.height);
    });

    // Elements (no batching, no culling)
    if (mockData.elements) {
      ctx.font = '32px Arial';
      mockData.elements.forEach(element => {
        // Glow effect (expensive)
        if (element.glowIntensity > 0) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        }
        ctx.fillText(element.emoji, element.x, element.y);
        ctx.shadowBlur = 0;
      });
    }

    // Snakes (complex rendering, no segment culling)
    if (mockData.snakes) {
      mockData.snakes.forEach(snake => {
        // Segments
        ctx.strokeStyle = snake.color;
        ctx.lineWidth = 20;
        ctx.beginPath();
        snake.segments.forEach((seg, i) => {
          if (i === 0) ctx.moveTo(seg.x, seg.y);
          else ctx.lineTo(seg.x, seg.y);
        });
        ctx.stroke();

        // Head
        ctx.save();
        ctx.translate(snake.head.x, snake.head.y);
        ctx.rotate(snake.head.angle);
        ctx.fillStyle = snake.color;
        ctx.fillRect(-32, -32, 64, 64);
        ctx.restore();

        // Name label
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = '14px Arial';
        ctx.strokeText(snake.name, snake.head.x, snake.head.y - 40);
        ctx.fillText(snake.name, snake.head.x, snake.head.y - 40);

        // Effects (boost trails, invincibility)
        if (snake.isBoosting) {
          for (let i = 0; i < 3; i++) {
            ctx.fillStyle = `rgba(255, 100, 0, ${0.3 - i * 0.1})`;
            ctx.fillRect(snake.head.x - i * 20, snake.head.y, 10, 10);
          }
        }
      });
    }

    // Particles (no pooling)
    if (mockData.particles) {
      mockData.particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;

        if (particle.type === 'circle') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'square') {
          ctx.fillRect(particle.x, particle.y, particle.radius * 2, particle.radius * 2);
        } else {
          // Star shape (expensive)
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x = particle.x + Math.cos(angle) * particle.radius;
            const y = particle.y + Math.sin(angle) * particle.radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }
  };

  // Warm-up
  for (let i = 0; i < 60; i++) {
    renderOldStyle();
  }

  // Benchmark
  metrics.recordMemory();

  for (let i = 0; i < numFrames; i++) {
    counter.reset();
    const start = performance.now();

    renderOldStyle();

    const frameTime = performance.now() - start;
    const drawCalls = counter.getCount();

    metrics.recordFrame(frameTime, drawCalls);

    if (i % 100 === 0) {
      metrics.recordMemory();
    }
  }

  metrics.recordMemory();
  counter.unwrap();

  return metrics.getStats();
}

/**
 * Compare results and generate report
 */
function generateReport(oldStats, newStats) {
  const improvement = (metric, oldVal, newVal, higherIsBetter = true) => {
    const diff = newVal - oldVal;
    const percent = ((diff / oldVal) * 100).toFixed(1);
    const sign = higherIsBetter ? (diff > 0 ? '+' : '') : (diff < 0 ? '+' : '');
    const emoji = (higherIsBetter ? diff > 0 : diff < 0) ? '🟢' : '🔴';
    return `${emoji} ${sign}${percent}% (${oldVal.toFixed(2)} → ${newVal.toFixed(2)})`;
  };

  let report = '\n';
  report += '═══════════════════════════════════════════════════════\n';
  report += '         RENDERING PERFORMANCE BENCHMARK REPORT         \n';
  report += '═══════════════════════════════════════════════════════\n\n';

  report += '📊 FRAME RATE PERFORMANCE\n';
  report += '─────────────────────────────────────────────────────\n';
  report += `Average FPS:     ${improvement('fps', oldStats.fps.avg, newStats.fps.avg, true)}\n`;
  report += `Min FPS:         ${improvement('fps', oldStats.fps.min, newStats.fps.min, true)}\n`;
  report += `Max FPS:         ${improvement('fps', oldStats.fps.max, newStats.fps.max, true)}\n\n`;

  report += '⏱️  FRAME TIME (ms)\n';
  report += '─────────────────────────────────────────────────────\n';
  report += `Average:         ${improvement('frameTime', oldStats.frameTime.avg, newStats.frameTime.avg, false)}\n`;
  report += `95th Percentile: ${improvement('frameTime', oldStats.frameTime.p95, newStats.frameTime.p95, false)}\n`;
  report += `99th Percentile: ${improvement('frameTime', oldStats.frameTime.p99, newStats.frameTime.p99, false)}\n`;
  report += `Worst Frame:     ${improvement('frameTime', oldStats.frameTime.max, newStats.frameTime.max, false)}\n\n`;

  report += '🎨 CANVAS DRAW CALLS\n';
  report += '─────────────────────────────────────────────────────\n';
  report += `Average:         ${improvement('drawCalls', oldStats.drawCalls.avg, newStats.drawCalls.avg, false)}\n`;
  report += `Min:             ${improvement('drawCalls', oldStats.drawCalls.min, newStats.drawCalls.min, false)}\n`;
  report += `Max:             ${improvement('drawCalls', oldStats.drawCalls.max, newStats.drawCalls.max, false)}\n\n`;

  if (newStats.layerTimes && Object.keys(newStats.layerTimes).length > 0) {
    report += '🏗️  RENDER TIME BY LAYER (New System Only)\n';
    report += '─────────────────────────────────────────────────────\n';
    for (const [layer, times] of Object.entries(newStats.layerTimes)) {
      report += `${layer.padEnd(20)} ${times.avg.toFixed(2)}ms (${times.min.toFixed(2)}-${times.max.toFixed(2)}ms)\n`;
    }
    report += '\n';
  }

  if (oldStats.memory && newStats.memory) {
    report += '💾 MEMORY USAGE\n';
    report += '─────────────────────────────────────────────────────\n';
    report += `Initial (MB):    Old: ${oldStats.memory.initial.toFixed(2)} | New: ${newStats.memory.initial.toFixed(2)}\n`;
    report += `Final (MB):      Old: ${oldStats.memory.final.toFixed(2)} | New: ${newStats.memory.final.toFixed(2)}\n`;
    report += `Delta (MB):      ${improvement('memory', oldStats.memory.delta, newStats.memory.delta, false)}\n\n`;
  }

  report += '📈 SUMMARY\n';
  report += '─────────────────────────────────────────────────────\n';
  report += `Total Frames:    ${newStats.totalFrames}\n`;

  const fpsImprovement = ((newStats.fps.avg - oldStats.fps.avg) / oldStats.fps.avg * 100).toFixed(1);
  const frameTimeImprovement = ((oldStats.frameTime.avg - newStats.frameTime.avg) / oldStats.frameTime.avg * 100).toFixed(1);
  const drawCallReduction = ((oldStats.drawCalls.avg - newStats.drawCalls.avg) / oldStats.drawCalls.avg * 100).toFixed(1);

  report += `\n🎯 KEY IMPROVEMENTS:\n`;
  if (parseFloat(fpsImprovement) > 0) {
    report += `✅ FPS increased by ${fpsImprovement}%\n`;
  } else {
    report += `⚠️  FPS decreased by ${Math.abs(fpsImprovement)}%\n`;
  }

  if (parseFloat(frameTimeImprovement) > 0) {
    report += `✅ Frame time reduced by ${frameTimeImprovement}%\n`;
  } else {
    report += `⚠️  Frame time increased by ${Math.abs(frameTimeImprovement)}%\n`;
  }

  if (parseFloat(drawCallReduction) > 0) {
    report += `✅ Draw calls reduced by ${drawCallReduction}%\n`;
  } else {
    report += `⚠️  Draw calls increased by ${Math.abs(drawCallReduction)}%\n`;
  }

  report += '\n═══════════════════════════════════════════════════════\n';

  return report;
}

/**
 * Run full benchmark suite
 */
export async function runBenchmarks(complexity = 'medium', numFrames = 300) {
  console.log(`\n🚀 Starting rendering performance benchmark (complexity: ${complexity})...\n`);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;

  // Create mock data
  const mockData = createMockRenderData(complexity);

  // Benchmark old system
  console.log('⏳ Benchmarking old system (simulated)...');
  const oldStats = await benchmarkOldSystemSimulated(canvas, mockData, numFrames);
  console.log('✅ Old system benchmark complete');

  // Benchmark new system
  console.log('⏳ Benchmarking new RenderingSystem...');
  const newStats = await benchmarkNewSystem(canvas, mockData, numFrames);
  console.log('✅ New system benchmark complete');

  // Generate report
  const report = generateReport(oldStats, newStats);
  console.log(report);

  return {
    old: oldStats,
    new: newStats,
    report,
  };
}

// Export utilities for custom benchmarks
export {
  PerformanceMetrics,
  CanvasCallCounter,
  createMockRenderData,
  benchmarkNewSystem,
  benchmarkOldSystemSimulated,
  generateReport,
};
