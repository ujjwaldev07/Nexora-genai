import React, { memo } from 'react';
import { motion } from 'motion/react';

// Design easing curves
export const MOTION_TRANSITIONS = {
  cinematic: {
    duration: 0.65,
    ease: [0.16, 1, 0.3, 1] as const,
  },
  smooth: {
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1] as const,
  },
  swift: {
    duration: 0.25,
    ease: [0.32, 0.72, 0, 1] as const,
  },
};

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export const FadeIn: React.FC<MotionWrapperProps> = memo(({
  children,
  className = '',
  delay = 0,
  id,
}) => (
  <motion.div
    id={id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
));
FadeIn.displayName = 'FadeIn';

export const FadeUp: React.FC<MotionWrapperProps & { distance?: number }> = memo(({
  children,
  className = '',
  delay = 0,
  distance = 12,
  id,
}) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: distance, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -distance, filter: 'blur(4px)' }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
));
FadeUp.displayName = 'FadeUp';

export const ScaleIn: React.FC<MotionWrapperProps & { initialScale?: number }> = memo(({
  children,
  className = '',
  delay = 0,
  initialScale = 0.95,
  id,
}) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, scale: initialScale, filter: 'blur(4px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: initialScale }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
));
ScaleIn.displayName = 'ScaleIn';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export const TextReveal: React.FC<TextRevealProps> = memo(({
  text,
  className = '',
  delay = 0,
  as: Component = 'span',
}) => {
  const words = text.split(' ');

  return (
    <Component className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.25em] align-bottom">
          <motion.span
            initial={{ opacity: 0, y: '100%', filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
            transition={{
              duration: 0.6,
              delay: delay + index * 0.045,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
});
TextReveal.displayName = 'TextReveal';

interface KineticHeadlineProps {
  badge?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export const KineticHeadline: React.FC<KineticHeadlineProps> = memo(({
  badge,
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>{badge}</span>
        </motion.div>
      )}

      <div className="overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          {title}
        </motion.h1>
      </div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
});
KineticHeadline.displayName = 'KineticHeadline';
