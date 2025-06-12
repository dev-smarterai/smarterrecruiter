import { useEffect, useRef } from 'react';
import { aiPageBuilder, BlockAnimationConfig } from '@/lib/ai-animations';

/**
 * Hook to add AI-style entrance animations to components
 */
export function useAIEntrance(config: BlockAnimationConfig = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      aiPageBuilder.animateContentBlock(ref.current, config);
    }
  }, [config]);

  return ref;
}

/**
 * Hook to animate a grid of items with staggered entrance
 */
export function useAIGrid(config: BlockAnimationConfig = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      aiPageBuilder.animateGrid(ref.current, config);
    }
  }, [config]);

  return ref;
}

/**
 * Hook to create typewriter effect for text
 */
export function useTypewriter(text: string, speed: number = 50) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && text) {
      aiPageBuilder.typewriterEffect(ref.current, text, speed);
    }
  }, [text, speed]);

  return ref;
}

/**
 * Hook to animate content blocks as they appear in viewport
 */
export function useInViewAnimation(config: BlockAnimationConfig = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            aiPageBuilder.animateContentBlock(entry.target as HTMLElement, config);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [config]);

  return ref;
} 