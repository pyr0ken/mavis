import { useState, useEffect, useRef } from 'react';

interface UseAnimatedPlaceholderOptions {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  active?: boolean;
}

export const useAnimatedPlaceholder = ({
  phrases,
  typingSpeed = 38,
  deletingSpeed = 22,
  pauseDuration = 2400,
  active = true,
}: UseAnimatedPlaceholderOptions) => {
  const [currentText, setCurrentText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!active || phrases.length === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentText('');
      setIsDeleting(false);
      return;
    }

    const currentPhrase = phrases[phraseIndex % phrases.length];

    if (!isDeleting) {
      // Typing forward
      if (currentText.length < currentPhrase.length) {
        timerRef.current = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        }, typingSpeed + Math.random() * 15);
      } else {
        // Finished typing full phrase, pause before deleting
        timerRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting backwards
      if (currentText.length > 0) {
        timerRef.current = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, currentText, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration]);

  return active ? currentText : '';
};
