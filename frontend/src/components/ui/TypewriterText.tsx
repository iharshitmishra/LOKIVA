import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { FormattedMessageContent } from './FormattedMessageContent';

const WORDS_PER_TICK = 2;
const TICK_MS = 32;

interface TypewriterTextProps {
  content: string;
  isUser?: boolean;
  /** True while this message should reveal itself word by word. */
  animate: boolean;
  /** Fires once the full text has been revealed. */
  onDone?: () => void;
  className?: string;
}

/**
 * Renders assistant replies the way a live agent types: words appear one
 * after another with a soft blinking cursor until the message completes.
 * History messages, user messages, and reduced-motion users get the full
 * formatted text instantly.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  content,
  isUser = false,
  animate,
  onDone,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const tokens = useMemo(() => content.split(/(\s+)/).filter((t) => t.length > 0), [content]);
  const [count, setCount] = useState(animate ? 0 : tokens.length);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const rootRef = useRef<HTMLDivElement>(null);

  const typing = animate && !shouldReduceMotion && count < tokens.length;

  // Reset when a different message becomes the one being typed
  useEffect(() => {
    if (!animate || shouldReduceMotion) {
      doneRef.current = true;
      setCount(tokens.length);
      return;
    }
    doneRef.current = false;
    setCount(0);
  }, [animate, shouldReduceMotion, tokens]);

  // Reveal words one after another
  useEffect(() => {
    if (!animate || shouldReduceMotion) return;
    if (count >= tokens.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    const id = window.setTimeout(() => {
      setCount((c) => Math.min(tokens.length, c + WORDS_PER_TICK));
    }, TICK_MS);
    return () => window.clearTimeout(id);
  }, [animate, count, tokens.length, shouldReduceMotion]);

  // Keep the growing bubble in view while it types
  useEffect(() => {
    if (typing) rootRef.current?.scrollIntoView({ block: 'end' });
  }, [count, typing]);

  const visibleText = typing ? tokens.slice(0, count).join('') : content;

  return (
    <div ref={rootRef} className={className}>
      <FormattedMessageContent content={visibleText} isUser={isUser} />
      {typing && (
        <span
          aria-hidden="true"
          className="inline-block w-[3px] h-3.5 sm:h-4 bg-[#C1443B] rounded-full align-[-2px] ml-0.5 animate-pulse"
        />
      )}
    </div>
  );
};

export default TypewriterText;
