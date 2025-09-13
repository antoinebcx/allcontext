import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Custom hook for observing element intersection with viewport
 * Provides clean API for detecting when elements enter/exit the viewport
 */
export function useIntersectionObserver<T extends Element = Element>(
  elementRef: RefObject<T | null>,
  options?: IntersectionObserverInit
): IntersectionObserverEntry | undefined {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry);
  };

  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    const hasSupport = !!window.IntersectionObserver;
    if (!hasSupport) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    const observer = new IntersectionObserver(updateEntry, options);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options?.root, options?.rootMargin, options?.threshold]);

  return entry;
}

/**
 * Simplified hook that just returns boolean for visibility
 */
export function useIsVisible<T extends Element = Element>(
  ref: RefObject<T | null>,
  options?: IntersectionObserverInit
): boolean {
  const entry = useIntersectionObserver(ref, options);
  return !!entry?.isIntersecting;
}
