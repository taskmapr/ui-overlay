import { useState, useEffect, useCallback } from 'react';
import { getVisibleHtmlIds, getVisibleElementSnapshots, VisibleElementSnapshot } from '../utils/domVisibility';

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
 * Hook to get rich snapshots of visible HTML elements in the viewport
 * This captures actual DOM elements with id attributes and their metadata
 * @param options Configuration options
 * @returns Object containing:
 *   - snapshots: Array of detailed element snapshots
 *   - visibleIds: Array of HTML id strings (for backward compatibility)
 *   - refresh: Function to manually trigger a refresh
 */
export const useVisibleHtmlIds = (options: UseVisibleHtmlIdsOptions = {}) => {
  const { watch = false, interval = 1000 } = options;
  const [snapshots, setSnapshots] = useState<VisibleElementSnapshot[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const elementSnapshots = getVisibleElementSnapshots();
    const ids = getVisibleHtmlIds();
    
    setSnapshots(elementSnapshots);
    setVisibleIds(ids);
    
    return { snapshots: elementSnapshots, ids };
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
    snapshots,
    visibleIds, // Maintained for backward compatibility
    refresh,
  };
};
