import React, { useState, useEffect } from 'react';
import { FormattedMessageContent } from './FormattedMessageContent';

interface TypewriterTextProps {
  content: string;
  animate?: boolean;
  onDone?: () => void;
  speedMs?: number;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  content,
  animate = true,
  onDone,
  speedMs = 12,
  className,
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : content);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(content);
      onDone?.();
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      currentIndex += 4; // Reveal in small chunks for smooth natural reading
      if (currentIndex >= content.length) {
        setDisplayedText(content);
        clearInterval(interval);
        onDone?.();
      } else {
        setDisplayedText(content.slice(0, currentIndex));
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [content, animate, speedMs, onDone]);

  return (
    <div className={className}>
      <FormattedMessageContent content={displayedText} isUser={false} />
    </div>
  );
};

export default TypewriterText;
