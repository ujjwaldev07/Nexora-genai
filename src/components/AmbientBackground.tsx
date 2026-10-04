import React, { useEffect, useRef, memo } from 'react';
import { NexoraAtmosphericArcs } from './motion/NexoraAtmosphericArcs';
import { AmbientBackgroundCanvas } from './AmbientBackgroundCanvas';
import { NexoraPointerGlow } from './motion/NexoraPointerGlow';
import { MotionQualityLevel } from './motion/motionConfig';

export type AmbientActivityState = 'idle' | 'typing' | 'thinking' | 'streaming' | 'reading';

interface AmbientBackgroundProps {
  theme?: 'dark' | 'light' | 'system';
  activityState?: AmbientActivityState;
  quality?: MotionQualityLevel;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = memo(({
  theme = 'dark',
  activityState = 'idle',
  quality = 'high',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Single RAF Coordinator for Ambient Background container lerping & visibility lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      container.style.setProperty('--mouse-x', '0px');
      container.style.setProperty('--mouse-y', '0px');
      return;
    }

    let animId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isVisible = !document.hidden;

    const handlePointerMove = (e: PointerEvent) => {
      // Subtle parallax offset: range [-10px, +10px]
      targetX = ((e.clientX / window.innerWidth) - 0.5) * 16;
      targetY = ((e.clientY / window.innerHeight) - 0.5) * 16;
    };

    const updateParallax = () => {
      if (!isVisible) return;

      // Smooth lerp interpolation (0.045 easing factor)
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;

      if (container) {
        container.style.setProperty('--mouse-x', `${currentX.toFixed(2)}px`);
        container.style.setProperty('--mouse-y', `${currentY.toFixed(2)}px`);
      }

      animId = requestAnimationFrame(updateParallax);
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        animId = requestAnimationFrame(updateParallax);
      } else {
        cancelAnimationFrame(animId);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animId = requestAnimationFrame(updateParallax);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#07070B] dark:bg-[#060609]"
      style={{
        transform: 'translate3d(var(--mouse-x, 0px), var(--mouse-y, 0px), 0)',
        willChange: 'transform',
      }}
    >
      {/* 1. LAYER: Deep Dark Radial Gradient Base for Spatial Depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 85% 65% at 50% 45%, rgba(18, 12, 36, 0.5) 0%, rgba(6, 6, 9, 0.98) 100%)'
            : 'radial-gradient(ellipse 85% 65% at 50% 45%, rgba(241, 245, 249, 0.85) 0%, rgba(226, 232, 240, 0.95) 100%)',
        }}
      />

      {/* 2. LAYER: Asynchronous Multi-Layer Planetary Arcs (Left Violet & Right Cyan) */}
      <NexoraAtmosphericArcs activityState={activityState} isDark={isDark} />

      {/* 3. LAYER: Top Center Deep Cosmic Haze */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[35vh] rounded-full blur-[100px] sm:blur-[140px] pointer-events-none opacity-40 dark:opacity-55"
        style={{
          background:
            'radial-gradient(ellipse, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 80%)',
        }}
      />

      {/* 4. LAYER: Cinematic Ambient Light Sweep */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none bg-gradient-to-r from-transparent via-indigo-300 to-transparent animate-light-sweep" />

      {/* 5. LAYER: Spatial Micro HUD Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* 6. LAYER: High-Performance Canvas-based Particle & Star Engine */}
      <AmbientBackgroundCanvas theme={theme} activityState={activityState} quality={quality} />

      {/* 7. LAYER: Diffuse Smooth Pointer Ambient Glow */}
      <NexoraPointerGlow activityState={activityState} isDark={isDark} />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
export default AmbientBackground;
