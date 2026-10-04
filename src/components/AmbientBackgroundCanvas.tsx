import React, { useEffect, useRef, memo } from 'react';
import { AmbientActivityState } from './AmbientBackground';
import { MotionQualityLevel, getMotionConfig } from './motion/motionConfig';

interface AmbientBackgroundCanvasProps {
  theme?: 'dark' | 'light' | 'system';
  activityState?: AmbientActivityState;
  quality?: MotionQualityLevel;
}

interface DepthParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depthLayer: 'bg' | 'mid' | 'fg';
  colorRgb: string;
}

export const AmbientBackgroundCanvas: React.FC<AmbientBackgroundCanvasProps> = memo(({
  theme = 'dark',
  activityState = 'idle',
  quality = 'high',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(activityState);
  stateRef.current = activityState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: DepthParticle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse / Pointer Parallax Target and Current Lerp
    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let mouseCurrentX = 0;
    let mouseCurrentY = 0;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = mediaQuery.matches;

    // Hardware Concurrency Adaptive Quality Check
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const effectiveQuality: MotionQualityLevel = 
      isReducedMotion 
        ? 'reduced' 
        : cores <= 2 
          ? 'low' 
          : cores <= 4 && quality === 'high' 
            ? 'medium' 
            : quality;

    const motionCfg = getMotionConfig(effectiveQuality);

    // Dark mode check
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const colors = {
      cyan: isDark ? '56, 189, 248' : '14, 165, 233',
      indigo: isDark ? '129, 140, 248' : '79, 70, 229',
      purple: isDark ? '192, 132, 252' : '147, 51, 234',
      white: isDark ? '248, 250, 252' : '100, 116, 139',
    };

    // Calculate adaptive particle count based on screen area & performance profile
    const area = width * height;
    let maxParticles = 65;
    if (width < 768) {
      maxParticles = 24;
    } else if (width < 1280) {
      maxParticles = 45;
    }

    const calculatedCount = Math.min(Math.floor(area / 28000), maxParticles, motionCfg.particleCount);
    const particleCount = Math.max(12, calculatedCount);
    
    particles = [];
    const colorPalette = [colors.cyan, colors.indigo, colors.purple, colors.white, colors.white];

    // Generate 3 depth layers: 50% Background, 35% Midground, 15% Foreground
    for (let i = 0; i < particleCount; i++) {
      const randDepth = Math.random();
      let depthLayer: 'bg' | 'mid' | 'fg' = 'bg';
      let radius = 0.6;
      let baseAlpha = 0.2;
      let vx = (Math.random() - 0.5) * 0.04;
      let vy = (Math.random() - 0.5) * 0.04;

      if (randDepth > 0.85) {
        depthLayer = 'fg';
        radius = Math.random() * 0.8 + 1.4;
        baseAlpha = Math.random() * 0.3 + 0.35;
        vx = (Math.random() - 0.5) * 0.12;
        vy = (Math.random() - 0.5) * 0.12;
      } else if (randDepth > 0.50) {
        depthLayer = 'mid';
        radius = Math.random() * 0.6 + 0.9;
        baseAlpha = Math.random() * 0.25 + 0.25;
        vx = (Math.random() - 0.5) * 0.07;
        vy = (Math.random() - 0.5) * 0.07;
      } else {
        depthLayer = 'bg';
        radius = Math.random() * 0.4 + 0.5;
        baseAlpha = Math.random() * 0.15 + 0.12;
        vx = (Math.random() - 0.5) * 0.03;
        vy = (Math.random() - 0.5) * 0.03;
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        radius,
        baseAlpha,
        twinkleSpeed: Math.random() * 0.02 + 0.006,
        twinklePhase: Math.random() * Math.PI * 2,
        depthLayer,
        colorRgb: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e: PointerEvent) => {
      mouseTargetX = (e.clientX / width - 0.5) * 28 * motionCfg.parallaxStrength;
      mouseTargetY = (e.clientY / height - 0.5) * 28 * motionCfg.parallaxStrength;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    if (!isReducedMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    let isVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !isReducedMotion && effectiveQuality !== 'reduced') {
        lastTime = performance.now();
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Static render for reduced motion or zero motion
    if (isReducedMotion || effectiveQuality === 'reduced') {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.baseAlpha * (isDark ? 0.75 : 0.45)})`;
        ctx.fill();
      }
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    let lastTime = performance.now();

    const render = () => {
      if (!isVisible) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth pointer parallax lerp
      mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.045;
      mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.045;

      // Attention-Aware speed and luminosity scaling
      const currentActivity = stateRef.current;
      let speedMult = 1.0;
      let alphaMult = 1.0;

      if (currentActivity === 'thinking') {
        speedMult = 2.2;
        alphaMult = 1.45;
      } else if (currentActivity === 'streaming') {
        speedMult = 1.4;
        alphaMult = 1.2;
      } else if (currentActivity === 'typing') {
        speedMult = 0.5;
        alphaMult = 0.75;
      } else if (currentActivity === 'reading') {
        speedMult = 0.25;
        alphaMult = 0.35;
      } else {
        speedMult = 0.8;
        alphaMult = 1.0;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw faint neural connection lines between nearby particles
      if (motionCfg.enableNeuralConnections && particles.length > 0 && currentActivity !== 'reading') {
        ctx.lineWidth = 0.65;
        const maxDist = 75;
        const maxDistSq = maxDist * maxDist;

        for (let i = 0; i < particles.length; i++) {
          if (particles[i].depthLayer === 'bg') continue;
          for (let j = i + 1; j < particles.length; j++) {
            if (particles[j].depthLayer === 'bg') continue;

            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              const lineAlpha = (1 - Math.sqrt(distSq) / maxDist) * 0.055 * alphaMult;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = isDark ? `rgba(168, 85, 247, ${lineAlpha})` : `rgba(79, 70, 229, ${lineAlpha * 0.6})`;
              ctx.stroke();
            }
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.twinklePhase += p.twinkleSpeed * speedMult;

        // Depth-dependent parallax weight
        const depthWeight = p.depthLayer === 'fg' ? 0.012 : p.depthLayer === 'mid' ? 0.007 : 0.003;

        // Move with velocity and pointer shift
        p.x += (p.vx * speedMult + mouseCurrentX * depthWeight) * dt * 60;
        p.y += (p.vy * speedMult + mouseCurrentY * depthWeight) * dt * 60;

        // Wrap around viewport edges smoothly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Subtle organic shimmering
        const shimmer = Math.sin(p.twinklePhase) * 0.28;
        const currentAlpha = Math.max(0.04, Math.min(0.95, (p.baseAlpha + shimmer) * alphaMult * (isDark ? 0.9 : 0.5)));

        // Draw particle body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.colorRgb}, ${currentAlpha})`;
        ctx.fill();

        // Foreground soft halo aura
        if (p.depthLayer === 'fg' && isDark) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.colorRgb}, ${currentAlpha * 0.18})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme, quality]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-90 transition-opacity duration-700 pointer-events-none"
    />
  );
});

AmbientBackgroundCanvas.displayName = 'AmbientBackgroundCanvas';
export default AmbientBackgroundCanvas;
