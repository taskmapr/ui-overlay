import { useState, useEffect, useCallback } from 'react';
import { getVisibleHtmlIds } from '../utils/domVisibility';

interface UseVisibleHtmlIdsOptions {
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
 * Hook to get HTML id attributes of currently visible elements in the viewport
 * This captures the actual hard-coded id attributes from the DOM, not TaskMapr's internal IDs
 * @param options Configuration options
 * @returns Array of HTML id strings and a refresh function
 */
export const useVisibleHtmlIds = (options: UseVisibleHtmlIdsOptions = {}) => {
  const { watch = false, interval = 1000 } = options;
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const ids = getVisibleHtmlIds();
    setVisibleIds(ids);
    return ids;
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    if (watch) {
      const intervalId = setInterval(refresh, interval);
      return () => clearInterval(intervalId);
    }
  }, [watch, interval, refresh]);

  return {
    visibleIds,
    refresh,
  };
};
