import React, { memo } from 'react';
import { AmbientActivityState } from '../AmbientBackground';

interface NexoraAtmosphericArcsProps {
  activityState?: AmbientActivityState;
  isDark?: boolean;
}

export const NexoraAtmosphericArcs: React.FC<NexoraAtmosphericArcsProps> = memo(({
  activityState = 'idle',
  isDark = true,
}) => {
  // Activity multiplier for opacity/glow
  let glowOpacity = 1.0;
  if (activityState === 'thinking') glowOpacity = 1.45;
  else if (activityState === 'streaming') glowOpacity = 1.2;
  else if (activityState === 'typing') glowOpacity = 0.8;
  else if (activityState === 'reading') glowOpacity = 0.35;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ opacity: glowOpacity }}>
      {/* ========================================================================= */}
      {/* 1. LEFT PURPLE ATMOSPHERIC ARC - MULTI-LAYERED SPATIAL SYSTEM             */}
      {/* ========================================================================= */}
      <div 
        className="absolute -left-[26vw] sm:-left-[19vw] lg:-left-[13vw] top-[4%] w-[68vw] sm:w-[52vw] lg:w-[44vw] h-[88vh] pointer-events-none"
      >
        {/* Layer 1A: Deep Atmospheric Haze Layer (32s timing) */}
        <div 
          className="absolute inset-0 rounded-full blur-[80px] sm:blur-[130px] opacity-60 dark:opacity-75 pointer-events-none animate-arc-left-haze"
          style={{
            background: 'radial-gradient(circle at 40% 50%, rgba(147, 51, 234, 0.4) 0%, rgba(79, 70, 229, 0.2) 60%, transparent 80%)'
          }}
        />

        {/* Layer 1B: Inner Resonant Glow (18s timing) */}
        <div 
          className="absolute inset-0 rounded-full blur-[50px] sm:blur-[85px] opacity-75 dark:opacity-90 pointer-events-none animate-arc-left-glow"
          style={{
            background: 'radial-gradient(circle at 60% 50%, rgba(168, 85, 247, 0.5) 0%, rgba(124, 58, 237, 0.3) 50%, transparent 75%)'
          }}
        />

        {/* Layer 1C: Outer Planetary Arc Crescent Structure (24s timing) */}
        <div 
          className="absolute inset-0 rounded-full border-[2.5px] sm:border-[3.5px] border-fuchsia-400/45 dark:border-purple-300/70 blur-[0.8px] shadow-[0_0_55px_rgba(192,132,252,0.65),inset_0_0_30px_rgba(168,85,247,0.3)] pointer-events-none transform -rotate-12 animate-arc-left-outer"
          style={{
            clipPath: 'polygon(52% 0%, 100% 0%, 100% 100%, 52% 100%)'
          }}
        />

        {/* Layer 1D: High-Intensity Luminous Core Node on Curve */}
        <div 
          className="absolute top-[35%] right-[2%] w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/90 blur-[2px] shadow-[0_0_28px_#c084fc,0_0_50px_#a855f7] pointer-events-none animate-pulse-glow"
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT BLUE/CYAN ATMOSPHERIC ARC - INDEPENDENT ASYNCHRONOUS SYSTEM      */}
      {/* ========================================================================= */}
      <div 
        className="absolute -right-[24vw] sm:-right-[17vw] lg:-right-[11vw] top-[18%] w-[64vw] sm:w-[48vw] lg:w-[40vw] h-[82vh] pointer-events-none"
      >
        {/* Layer 2A: Deep Electric Blue Atmospheric Haze (36s timing) */}
        <div 
          className="absolute inset-0 rounded-full blur-[85px] sm:blur-[140px] opacity-55 dark:opacity-75 pointer-events-none animate-arc-right-haze"
          style={{
            background: 'radial-gradient(circle at 60% 50%, rgba(14, 165, 233, 0.4) 0%, rgba(99, 102, 241, 0.25) 55%, transparent 80%)'
          }}
        />

        {/* Layer 2B: Core Cyan Energy Glow (22s timing) */}
        <div 
          className="absolute inset-0 rounded-full blur-[55px] sm:blur-[90px] opacity-70 dark:opacity-85 pointer-events-none animate-arc-right-glow"
          style={{
            background: 'radial-gradient(circle at 40% 50%, rgba(56, 189, 248, 0.5) 0%, rgba(99, 102, 241, 0.35) 45%, transparent 75%)'
          }}
        />

        {/* Layer 2C: Luminous Right Horizon Arc Rim (30s timing) */}
        <div 
          className="absolute inset-0 rounded-full border-[2px] sm:border-[3px] border-cyan-300/40 dark:border-cyan-300/60 blur-[1px] shadow-[0_0_50px_rgba(56,189,248,0.55),inset_0_0_25px_rgba(14,165,233,0.3)] pointer-events-none transform rotate-15 animate-arc-right-outer"
          style={{
            clipPath: 'polygon(0% 0%, 48% 0%, 48% 100%, 0% 100%)'
          }}
        />

        {/* Layer 2D: High-Intensity Luminous Core Node on Right Arc */}
        <div 
          className="absolute top-[48%] left-[1%] w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-cyan-100/90 blur-[1.5px] shadow-[0_0_25px_#38bdf8,0_0_45px_#0284c7] pointer-events-none animate-pulse-glow"
          style={{ animationDelay: '1.8s' }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTER COSMIC COMPUTATIONAL ENERGY FIELD (BEHIND HERO)                 */}
      {/* ========================================================================= */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] sm:w-[55vw] h-[55vh] rounded-full blur-[110px] sm:blur-[160px] pointer-events-none opacity-35 dark:opacity-45 animate-atmosphere-breathe"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.22) 0%, rgba(59, 130, 246, 0.12) 45%, transparent 75%)'
        }}
      />
    </div>
  );
});

NexoraAtmosphericArcs.displayName = 'NexoraAtmosphericArcs';
