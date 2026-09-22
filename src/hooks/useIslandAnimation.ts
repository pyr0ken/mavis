import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { invoke } from '@tauri-apps/api/core';
import { IslandState, NOTCH_GEOMETRIES } from '../types/island';

// Register GSAP CustomEase plugin once
gsap.registerPlugin(CustomEase);

// Register Apple-inspired fluid easing curves
try {
  // Soft, organic liquid glass spring with minimal, natural overshoot (~3%)
  CustomEase.create('appleSpring', 'M0,0 C0.16,1 0.28,1.03 1,1');
  // Silky smooth deceleration curve for expanding cards
  CustomEase.create('appleExpand', 'M0,0 C0.16,1 0.3,1.015 1,1');
  // Fast, cushioned retraction curve
  CustomEase.create('appleRetract', 'M0,0 C0.22,1 0.36,1 1,1');
  // Buttery smooth general curve
  CustomEase.create('appleSmooth', 'M0,0 C0.16,1 0.3,1 1,1');
} catch {
  // Fallbacks handled gracefully
}

interface UseIslandAnimationOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  idleContentRef?: React.RefObject<HTMLDivElement | null>;
  actionContentRef?: React.RefObject<HTMLDivElement | null>;
  successContentRef?: React.RefObject<HTMLDivElement | null>;
  state: IslandState;
  lineCount?: number;
  onAnimationEnd?: () => void;
}

const updateInputRegion = (width: number, height: number) => {
  try {
    const w = width > 0 ? width + 30 : 0;
    const h = height > 0 ? height + 20 : 0;
    invoke('update_input_region', { width: Math.round(w), height: Math.round(h) }).catch(() => {});
  } catch {
    // Ignored outside Tauri environment
  }
};

export const useIslandAnimation = ({
  containerRef,
  idleContentRef,
  actionContentRef,
  successContentRef,
  state,
  lineCount = 1,
  onAnimationEnd,
}: UseIslandAnimationOptions) => {
  const isInitialized = useRef(false);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);
  const previousState = useRef<IslandState>('hidden');

  useEffect(() => {
    const el = containerRef.current;
    const idleContent = idleContentRef?.current;
    const actionContent = actionContentRef?.current;
    const successContent = successContentRef?.current;
    if (!el) return;

    const clampedLines = Math.min(3, Math.max(1, lineCount || 1));
    const dynamicTypingHeight = 54 + (clampedLines - 1) * 24;

    // Initial setup on mount
    if (!isInitialized.current) {
      isInitialized.current = true;
      previousState.current = state;
      const initGeo = NOTCH_GEOMETRIES[state];
      const initialHeight = state === 'typing' ? dynamicTypingHeight : initGeo.height;

      // Dynamically restrict input shape so underlying apps receive all scroll and click events
      updateInputRegion(initGeo.width, initialHeight);

      // Anchor top-center for organic bezel physics
      gsap.set(el, {
        xPercent: -50,
        transformOrigin: '50% 0%',
      });

      if (state === 'hidden') {
        gsap.set(el, {
          y: -65,
          opacity: 0,
          scaleX: 0.92,
          scaleY: 0.6,
          width: initGeo.width,
          height: initGeo.height,
          borderRadius: initGeo.borderRadius,
        });
        if (idleContent) gsap.set(idleContent, { opacity: 0, display: 'none' });
        if (actionContent) gsap.set(actionContent, { opacity: 0, display: 'none' });
        if (successContent) gsap.set(successContent, { opacity: 0, display: 'none' });
      } else if (state === 'idle') {
        gsap.set(el, {
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: initGeo.width,
          height: initGeo.height,
          borderRadius: initGeo.borderRadius,
        });
        if (idleContent) gsap.set(idleContent, { opacity: 1, display: 'flex', y: 0 });
        if (actionContent) gsap.set(actionContent, { opacity: 0, display: 'none' });
        if (successContent) gsap.set(successContent, { opacity: 0, display: 'none' });
      } else if (state === 'listening') {
        gsap.set(el, {
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: initGeo.width,
          height: initGeo.height,
          borderRadius: initGeo.borderRadius,
        });
        if (idleContent) gsap.set(idleContent, { opacity: 1, display: 'flex', y: 0 });
        if (actionContent) gsap.set(actionContent, { opacity: 0, display: 'none' });
        if (successContent) gsap.set(successContent, { opacity: 0, display: 'none' });
      } else if (state === 'typing') {
        gsap.set(el, {
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: initGeo.width,
          height: dynamicTypingHeight,
          borderRadius: initGeo.borderRadius,
        });
        if (idleContent) gsap.set(idleContent, { opacity: 1, display: 'flex', y: 0 });
        if (actionContent) gsap.set(actionContent, { opacity: 0, display: 'none' });
        if (successContent) gsap.set(successContent, { opacity: 0, display: 'none' });
      } else if (state === 'action') {
        gsap.set(el, {
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: initGeo.width,
          height: initGeo.height,
          borderRadius: initGeo.borderRadius,
        });
        if (idleContent) gsap.set(idleContent, { opacity: 1, display: 'flex', y: 0 });
        if (actionContent) gsap.set(actionContent, { opacity: 1, display: 'block' });
        if (successContent) gsap.set(successContent, { opacity: 0, display: 'none' });
      } else if (state === 'success') {
        gsap.set(el, {
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: initGeo.width,
          height: initGeo.height,
          borderRadius: initGeo.borderRadius,
        });
        if (idleContent) gsap.set(idleContent, { opacity: 0, display: 'none' });
        if (actionContent) gsap.set(actionContent, { opacity: 0, display: 'none' });
        if (successContent) gsap.set(successContent, { opacity: 1, display: 'flex' });
      }
      return;
    }

    if (activeTimeline.current) {
      activeTimeline.current.kill();
    }

    const tl = gsap.timeline();
    activeTimeline.current = tl;
    const prevState = previousState.current;
    previousState.current = state;
    const geo = NOTCH_GEOMETRIES[state];

    const targetHeight = state === 'typing' ? dynamicTypingHeight : geo.height;

    // Update the native input hit-test shape to exactly match the target notch size
    updateInputRegion(geo.width, targetHeight);

    // Ensure transformOrigin is locked at top-center
    gsap.set(el, { transformOrigin: '50% 0%' });

    // ==========================================
    // Transition 1: To Hidden (Closing/Dismissing)
    // ==========================================
    if (state === 'hidden') {
      if (actionContent) {
        tl.to(actionContent, {
          opacity: 0,
          y: -10,
          scale: 0.98,
          duration: 0.16,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(actionContent, { display: 'none' });
          },
        });
      }
      if (successContent) {
        tl.to(successContent, {
          opacity: 0,
          scale: 0.9,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(successContent, { display: 'none' });
          },
        });
      }
      if (idleContent) {
        tl.to(idleContent, {
          opacity: 0,
          y: -6,
          duration: 0.16,
          ease: 'power2.in',
        }, '<');
      }

      // Smooth liquid retract into top bezel
      tl.to(el, {
        xPercent: -50,
        width: geo.width,
        height: geo.height,
        borderRadius: geo.borderRadius,
        y: -65,
        scaleX: 0.92,
        scaleY: 0.55,
        opacity: 0,
        duration: 0.22,
        ease: 'appleRetract',
        onComplete: () => {
          if (onAnimationEnd) onAnimationEnd();
        },
      }, '-=0.08');
      return;
    }

    // ==========================================
    // Transition 2: To Idle (Opening or Collapsing)
    // ==========================================
    if (state === 'idle') {
      if (actionContent) {
        tl.to(actionContent, {
          opacity: 0,
          y: -12,
          scale: 0.98,
          duration: 0.2,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(actionContent, { display: 'none' });
          },
        });
      }
      if (successContent) {
        tl.to(successContent, {
          opacity: 0,
          scale: 0.92,
          duration: 0.16,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(successContent, { display: 'none' });
          },
        });
      }

      if (prevState === 'hidden') {
        // Opening from top bezel into idle notch
        if (idleContent) {
          gsap.set(idleContent, { display: 'flex', opacity: 0, y: -6 });
        }
        tl.to(el, {
          xPercent: -50,
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: geo.width,
          height: geo.height,
          borderRadius: geo.borderRadius,
          duration: 0.32,
          ease: 'appleSpring',
        });
        if (idleContent) {
          tl.to(idleContent, {
            opacity: 1,
            y: 0,
            duration: 0.24,
            ease: 'appleSmooth',
          }, '-=0.25');
        }
      } else if (prevState === 'success') {
        // Morphing from success toast back to idle
        tl.to(el, {
          xPercent: -50,
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: geo.width,
          height: geo.height,
          borderRadius: geo.borderRadius,
          duration: 0.44,
          ease: 'appleSpring',
        }, '-=0.14');

        if (idleContent) {
          gsap.set(idleContent, { display: 'flex' });
          tl.fromTo(
            idleContent,
            { opacity: 0, y: 4 },
            { opacity: 1, y: 0, duration: 0.28, ease: 'appleSmooth' },
            '-=0.25'
          );
        }
      } else {
        // Collapsing smoothly from Action / Listening to Idle notch
        // Note: idleContent (Avatar) stays fully visible (opacity: 1) and fluidly glides along with container width!
        if (idleContent) {
          gsap.set(idleContent, { display: 'flex', opacity: 1, y: 0 });
        }

        tl.to(el, {
          xPercent: -50,
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: geo.width,
          height: geo.height,
          borderRadius: geo.borderRadius,
          duration: 0.46,
          ease: 'appleSpring',
        }, '-=0.14');
      }
      return;
    }

    // ==========================================
    // Transition 3: To Listening
    // ==========================================
    if (state === 'listening') {
      if (actionContent) {
        tl.to(actionContent, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(actionContent, { display: 'none' });
          },
        });
      }
      if (successContent) {
        tl.to(successContent, {
          opacity: 0,
          scale: 0.92,
          duration: 0.18,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(successContent, { display: 'none' });
          },
        });
      }

      if (idleContent) {
        gsap.set(idleContent, { display: 'flex', opacity: 1, y: 0 });
      }

      if (prevState === 'hidden') {
        tl.to(el, {
          xPercent: -50,
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: geo.width,
          height: geo.height,
          borderRadius: geo.borderRadius,
          duration: 0.48,
          ease: 'appleSpring',
        });
      } else {
        tl.to(el, {
          xPercent: -50,
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: geo.width,
          height: geo.height,
          borderRadius: geo.borderRadius,
          duration: geo.duration,
          ease: 'appleSpring',
        }, '-=0.1');
      }
      return;
    }

    // ==========================================
    // Transition 3.5: To Typing
    // ==========================================
    if (state === 'typing') {
      if (actionContent) {
        tl.to(actionContent, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(actionContent, { display: 'none' });
          },
        });
      }
      if (successContent) {
        tl.to(successContent, {
          opacity: 0,
          scale: 0.92,
          duration: 0.18,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(successContent, { display: 'none' });
          },
        });
      }

      if (idleContent) {
        gsap.set(idleContent, { display: 'flex', opacity: 1, y: 0 });
      }

      tl.to(el, {
        xPercent: -50,
        y: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        width: geo.width,
        height: targetHeight,
        borderRadius: geo.borderRadius,
        duration: geo.duration,
        ease: 'appleSmooth',
      }, '-=0.1');
      return;
    }

    // ==========================================
    // Transition 4: To Action (Gmail / Calendar Card)
    // ==========================================
    if (state === 'action') {
      if (successContent) {
        tl.to(successContent, {
          opacity: 0,
          duration: 0.15,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(successContent, { display: 'none' });
          },
        });
      }

      // Keep header (Avatar) fully visible without fading as it glides outward
      if (idleContent) {
        gsap.set(idleContent, { display: 'flex', opacity: 1, y: 0 });
      }

      if (prevState !== 'action') {
        // Smooth liquid morph outwards & downwards only when opening
        tl.to(el, {
          xPercent: -50,
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          width: geo.width,
          height: geo.height,
          borderRadius: geo.borderRadius,
          duration: geo.duration,
          ease: 'appleExpand',
        }, '-=0.08');

        if (actionContent) {
          gsap.set(actionContent, { display: 'block' });
          tl.fromTo(
            actionContent,
            { opacity: 0, y: 14, scale: 0.985 },
            { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'appleSmooth' },
            '-=0.38'
          );
        }
      } else {
        // Already in action mode - keep content completely stable without re-fading or reloading
        if (actionContent) {
          gsap.set(actionContent, { display: 'block', opacity: 1, scale: 1, y: 0 });
        }
      }
      return;
    }

    // ==========================================
    // Transition 5: To Success Confirmation Capsule
    // ==========================================
    if (state === 'success') {
      // Step 1: Smoothly fade and elevate the action form
      if (actionContent) {
        tl.to(actionContent, {
          opacity: 0,
          y: -8,
          scale: 0.98,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(actionContent, { display: 'none' });
          },
        });
      }
      if (idleContent) {
        tl.to(idleContent, {
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(idleContent, { display: 'none' });
          },
        }, '<');
      }

      // Step 2: Smoothly collapse the container into confirmation capsule
      tl.to(el, {
        xPercent: -50,
        width: geo.width,
        height: geo.height,
        borderRadius: geo.borderRadius,
        duration: 0.44,
        ease: 'appleSpring',
      }, '-=0.12');

      // Step 3: Reveal the success capsule content with a soft, joyful pop
      if (successContent) {
        gsap.set(successContent, { display: 'flex' });
        tl.fromTo(
          successContent,
          { opacity: 0, scale: 0.85, y: 4 },
          { opacity: 1, scale: 1, y: 0, duration: 0.36, ease: 'back.out(1.5)' },
          '-=0.22'
        );
      }
      return;
    }
  }, [state, lineCount, containerRef, idleContentRef, actionContentRef, successContentRef, onAnimationEnd]);
};
