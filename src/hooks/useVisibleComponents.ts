import { useState, useEffect, useCallback } from 'react';
import { useHighlight } from '../contexts/HighlightContext';
import { HighlightableComponent } from '../types';

interface UseVisibleComponentsOptions {
  /**
   * Enable automatic polling to detect visibility changes
   * @default false
   */
  watch?: boolean;
  /**
   * Polling interval in milliseconds when watch is enabled
   * @default 1000
   */
  interval?: number;
}

/**
 * Hook to get currently visible components in the viewport
 * @param options Configuration options
 * @returns Array of visible components and a refresh function
 */
export const useVisibleComponents = (options: UseVisibleComponentsOptions = {}) => {
  const { watch = false, interval = 1000 } = options;
  const { getVisibleComponents } = useHighlight();
  const [visibleComponents, setVisibleComponents] = useState<HighlightableComponent[]>([]);

  const refresh = useCallback(() => {
    const components = getVisibleComponents();
    setVisibleComponents(components);
    return components;
  }, [getVisibleComponents]);

  useEffect(() => {
    // Initial load
    refresh();

    if (watch) {
      const intervalId = setInterval(refresh, interval);
      return () => clearInterval(intervalId);
    }
  }, [watch, interval, refresh]);

  return {
    visibleComponents,
    refresh,
  };
};
