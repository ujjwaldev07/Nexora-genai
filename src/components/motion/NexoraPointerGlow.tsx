import React, { useEffect, useRef, memo } from 'react';
import { AmbientActivityState } from '../AmbientBackground';

interface NexoraPointerGlowProps {
  activityState?: AmbientActivityState;
  isDark?: boolean;
}

export const NexoraPointerGlow: React.FC<NexoraPointerGlowProps> = memo(({
  activityState = 'idle',
  isDark = true,
}) => {
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let animId: number;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let isVisible = !document.hidden;
    const handleVis = () => {
      isVisible = !document.hidden;
      if (isVisible) loop();
    };
    document.addEventListener('visibilitychange', handleVis);

    const loop = () => {
      if (!isVisible) return;
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (el) {
        el.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  const opacity =
    activityState === 'reading'
      ? 'opacity-[0.02]'
      : activityState === 'thinking'
      ? 'opacity-[0.08]'
      : 'opacity-[0.045]';

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className={`fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none blur-[120px] transition-opacity duration-700 ${opacity} z-0`}
      style={{
        background: isDark
          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(56, 189, 248, 0.2) 50%, transparent 75%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%)',
        willChange: 'transform',
      }}
    />
  );
});

NexoraPointerGlow.displayName = 'NexoraPointerGlow';
