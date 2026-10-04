import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, BrainCircuit, Activity, AlertCircle } from 'lucide-react';

export type AIOrbState = 'idle' | 'listening' | 'thinking' | 'streaming' | 'error';
export type AIOrbSize = 'xs' | 'sm' | 'md' | 'lg' | 'hero';

interface AICoreOrbProps {
  state?: AIOrbState;
  size?: AIOrbSize;
  className?: string;
  showStatusLabel?: boolean;
  statusText?: string;
}

export const AICoreOrb: React.FC<AICoreOrbProps> = memo(({
  state = 'idle',
  size = 'md',
  className = '',
  showStatusLabel = false,
  statusText,
}) => {
  // Dimensions per size
  const sizeStyles = {
    xs: {
      container: 'w-6 h-6',
      core: 'w-4 h-4',
      ring1: 'w-6 h-6',
      ring2: 'w-5 h-5',
      iconSize: 10,
    },
    sm: {
      container: 'w-8 h-8',
      core: 'w-5 h-5',
      ring1: 'w-8 h-8',
      ring2: 'w-7 h-7',
      iconSize: 12,
    },
    md: {
      container: 'w-16 h-16',
      core: 'w-10 h-10',
      ring1: 'w-16 h-16',
      ring2: 'w-13 h-13',
      iconSize: 18,
    },
    lg: {
      container: 'w-24 h-24',
      core: 'w-14 h-14',
      ring1: 'w-24 h-24',
      ring2: 'w-20 h-20',
      iconSize: 24,
    },
    hero: {
      container: 'w-32 sm:w-36 h-32 sm:h-36',
      core: 'w-20 sm:w-22 h-20 sm:h-22',
      ring1: 'w-32 sm:w-36 h-32 sm:h-36',
      ring2: 'w-26 sm:w-30 h-26 sm:h-30',
      iconSize: 32,
    },
  }[size];

  // State color mapping
  const colorMap = {
    idle: {
      core: 'from-indigo-600 via-indigo-500 to-purple-600',
      glow: 'rgba(99, 102, 241, 0.35)',
      ring: 'border-indigo-500/30',
      accent: 'text-indigo-400',
    },
    listening: {
      core: 'from-cyan-500 via-blue-500 to-indigo-600',
      glow: 'rgba(6, 182, 212, 0.45)',
      ring: 'border-cyan-400/40',
      accent: 'text-cyan-400',
    },
    thinking: {
      core: 'from-purple-600 via-indigo-500 to-fuchsia-500',
      glow: 'rgba(168, 85, 247, 0.55)',
      ring: 'border-purple-400/50',
      accent: 'text-purple-300',
    },
    streaming: {
      core: 'from-indigo-500 via-violet-500 to-emerald-500',
      glow: 'rgba(129, 140, 248, 0.5)',
      ring: 'border-emerald-400/40',
      accent: 'text-emerald-400',
    },
    error: {
      core: 'from-rose-600 via-amber-500 to-rose-700',
      glow: 'rgba(244, 63, 94, 0.45)',
      ring: 'border-rose-400/40',
      accent: 'text-rose-400',
    },
  }[state];

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${sizeStyles.container}`}>
        {/* 1. Deep Ambient Aura Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-700 pointer-events-none opacity-80"
          style={{ background: colorMap.glow }}
        />

        {/* 2. Outer Orbital Ring 1 */}
        <motion.div
          animate={{
            rotate: state === 'thinking' ? 360 : state === 'listening' ? 180 : 360,
            scale: state === 'listening' ? [1, 1.08, 1] : state === 'thinking' ? [1, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{
            rotate: {
              duration: state === 'thinking' ? 4 : state === 'streaming' ? 6 : 14,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: state === 'thinking' ? 1.5 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className={`absolute ${sizeStyles.ring1} rounded-full border border-dashed ${colorMap.ring} pointer-events-none opacity-60`}
        >
          {/* Orbital Satellite Dot */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-xs shadow-indigo-400" />
        </motion.div>

        {/* 3. Counter-Rotating Inner Orbital Ring 2 */}
        <motion.div
          animate={{
            rotate: -360,
            scale: state === 'thinking' ? [1, 0.95, 1] : [1, 0.98, 1],
          }}
          transition={{
            rotate: {
              duration: state === 'thinking' ? 6 : 18,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className={`absolute ${sizeStyles.ring2} rounded-full border border-dotted ${colorMap.ring} pointer-events-none opacity-40`}
        />

        {/* 4. Core Energy Orb */}
        <motion.div
          animate={{
            scale: state === 'thinking' ? [1, 1.07, 0.96, 1] : state === 'listening' ? [1, 1.12, 1] : [1, 1.03, 1],
            boxShadow: [
              `0 0 15px ${colorMap.glow}`,
              `0 0 30px ${colorMap.glow}`,
              `0 0 15px ${colorMap.glow}`,
            ],
          }}
          transition={{
            duration: state === 'thinking' ? 1.8 : state === 'listening' ? 1.2 : 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`${sizeStyles.core} rounded-2xl bg-gradient-to-tr ${colorMap.core} flex items-center justify-center text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm relative z-10 transition-colors duration-500`}
        >
          {/* Core Icon */}
          {state === 'thinking' ? (
            <BrainCircuit size={sizeStyles.iconSize} className="text-white animate-pulse" />
          ) : state === 'listening' ? (
            <Activity size={sizeStyles.iconSize} className="text-white animate-pulse" />
          ) : state === 'streaming' ? (
            <Sparkles size={sizeStyles.iconSize} className="text-white animate-spin" style={{ animationDuration: '4s' }} />
          ) : state === 'error' ? (
            <AlertCircle size={sizeStyles.iconSize} className="text-white" />
          ) : (
            <Zap size={sizeStyles.iconSize} className="text-white fill-white" />
          )}
        </motion.div>
      </div>

      {/* Optional Status Label for AI Thinking visualizer */}
      {showStatusLabel && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 dark:bg-white/[0.06] border border-white/[0.08] backdrop-blur-md text-[11px] font-mono text-slate-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>{statusText || (state === 'thinking' ? 'Synthesizing neural reasoning...' : state === 'streaming' ? 'Streaming response...' : 'Nexora AI')}</span>
        </motion.div>
      )}
    </div>
  );
});

AICoreOrb.displayName = 'AICoreOrb';
