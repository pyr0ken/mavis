import { useState, useEffect, useRef } from 'react';

interface UseTypewriterStreamOptions {
  text: string;
  speed?: number; // ms per char
  active: boolean;
  onComplete?: () => void;
}

export const useTypewriterStream = ({
  text,
  speed = 22,
  active,
  onComplete,
}: UseTypewriterStreamOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, active]);

  return {
    displayedText,
    setDisplayedText,
    isTyping,
  };
};
