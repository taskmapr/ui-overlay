import { useCallback, useMemo } from 'react';
import type { TaskMaprClientOptions } from '../types';
import { useHighlightOptional } from '../contexts/HighlightContext';

export interface UseTaskMaprActionHandlersOptions {
  /** Override individual handlers while keeping the rest of the defaults */
  overrides?: Partial<NonNullable<TaskMaprClientOptions['actionHandlers']>>;
  /** Allow hard reload navigation fallback when soft navigation fails */
  allowHardNavigationFallback?: boolean;
}

/**
 * Normalise a path and push it to the browser history without forcing a reload.
 * Falls back to `window.location.href` when a soft navigation cannot be performed.
 */
export function navigateToPath(path: string, allowHardFallback = true): void {
  if (!path || typeof window === 'undefined') {
    return;
  }

  try {
    const normalized = path.startsWith('http')
      ? new URL(path)
      : new URL(path.startsWith('/') ? path : `/${path}`, window.location.origin);

    const newUrl = `${normalized.pathname}${normalized.search}${normalized.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl !== newUrl) {
      window.history.pushState({}, '', newUrl);
    }

    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  } catch (error) {
    if (allowHardFallback) {
      console.warn('[TaskMapr] Falling back to hard navigation for', path, error);
      window.location.href = path;
    } else {
      console.warn('[TaskMapr] Navigation failed and hard fallback disabled for', path, error);
    }
  }
}

/**
 * Provides a set of default action handlers that integrate with the highlight context when available.
 * Consumers can override specific handlers via the `overrides` option.
 */
export function useTaskMaprActionHandlers(
  options: UseTaskMaprActionHandlersOptions = {}
): NonNullable<TaskMaprClientOptions['actionHandlers']> {
  const highlightContext = useHighlightOptional();

  const highlight = highlightContext?.highlight;
  const highlightComponent = highlightContext?.highlightComponent;

  const handleNavigate = useCallback(
    (path: string) => navigateToPath(path, options.allowHardNavigationFallback !== false),
    [options.allowHardNavigationFallback]
  );

  const handleHighlight = useCallback(
    (selectors: string[], duration?: number) => {
      if ((!highlight || typeof highlight !== 'function') && (!highlightComponent || typeof highlightComponent !== 'function')) {
        console.warn('[TaskMapr] Highlight context not available, skipping highlight action');
        return;
      }

      selectors.forEach((selector) => {
        if (
          selector.startsWith('#') ||
          selector.startsWith('.') ||
          selector.includes('[')
        ) {
          highlight?.(selector, duration);
        } else {
          const componentFound = highlightComponent?.(selector, duration);
          if (componentFound === false && highlight) {
            highlight(selector, duration);
          } else if (componentFound == null && highlight) {
            highlight(selector, duration);
          }
        }
      });
    },
    [highlight, highlightComponent]
  );

  const handleScrollTo = useCallback((selector: string, behavior: 'smooth' | 'auto' = 'smooth') => {
    if (typeof document === 'undefined') return;
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior });
    }
  }, []);

  const handleClick = useCallback((selector: string) => {
    if (typeof document === 'undefined') return;
    const element = document.querySelector(selector) as HTMLElement | null;
    element?.click();
  }, []);

  const { overrides } = options;

  return useMemo(
    () => ({
      navigate: overrides?.navigate ?? handleNavigate,
      highlight: overrides?.highlight ?? handleHighlight,
      scrollTo: overrides?.scrollTo ?? handleScrollTo,
      click: overrides?.click ?? handleClick,
    }),
    [overrides, handleNavigate, handleHighlight, handleScrollTo, handleClick]
  );
}


