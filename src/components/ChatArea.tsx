import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { ArrowDown } from 'lucide-react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { FadeUp, ScaleIn, TextReveal } from './motion/MotionPrimitives';
import { motion, AnimatePresence } from 'motion/react';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate: (id: string) => void;
  onEditUserMessage: (id: string, newContent: string) => void;
  onFeedback: (id: string, feedback: 'like' | 'dislike') => void;
  onSelectPromptTemplate: (prompt: string) => void;
  onOpenImageStudio?: () => void;
  onEditImage?: (imageUrl: string, prompt?: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = memo(({
  messages,
  isStreaming,
  onRegenerate,
  onEditUserMessage,
  onFeedback,
  onSelectPromptTemplate,
  onOpenImageStudio,
  onEditImage,
}) => {
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const userHasScrolledUp = useRef(false);
  const scrollTicking = useRef(false);

  // Check scroll position to determine if user scrolled away from bottom (throttled)
  const handleScroll = useCallback(() => {
    if (scrollTicking.current) return;
    scrollTicking.current = true;

    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        const isFar = distanceToBottom > 120;
        setShowScrollBottom(isFar);
        userHasScrolledUp.current = isFar;
      }
      scrollTicking.current = false;
    });
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollBottomRef.current?.scrollIntoView({ behavior });
    userHasScrolledUp.current = false;
    setShowScrollBottom(false);
  }, []);

  // Smooth scroll down automatically on new messages if user isn't reading past history
  useEffect(() => {
    if (!userHasScrolledUp.current) {
      const timeoutId = setTimeout(() => {
        scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none overflow-y-auto relative z-10">
        <div className="max-w-3xl w-full my-auto py-12 flex flex-col items-center justify-center space-y-6">
          {/* Centered Clean Hero Typography Section with Light Reveal Animation */}
          <div className="space-y-4 max-w-2xl px-4 flex flex-col items-center">
            {/* Title with Kinetic Word Reveal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] text-balance">
              <TextReveal text="Meet the next generation of intelligent interaction." delay={0.15} />
            </h1>

            {/* Supporting Minimal Subtext */}
            <FadeUp delay={0.4} distance={14}>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400/90 max-w-xl mx-auto leading-relaxed font-normal">
                Autonomous computational engine for deep data analytics, document synthesis, grounded intelligence, and generative asset design.
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 relative z-10 scroll-smooth"
    >
      <div className="space-y-4 max-w-3xl lg:max-w-4xl mx-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <MessageItem
                message={message}
                onRegenerate={onRegenerate}
                onEditUserMessage={onEditUserMessage}
                onFeedback={onFeedback}
                onEditImage={onEditImage}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div ref={scrollBottomRef} className="h-2" />

      {/* Floating Scroll-to-Bottom Quick Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-24 right-6 sm:right-8 z-30 p-2.5 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 backdrop-blur-md border border-indigo-400/30 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none flex items-center justify-center animate-fade-in"
          title="Scroll to latest message"
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
});

ChatArea.displayName = 'ChatArea';
