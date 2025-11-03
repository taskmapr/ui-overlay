import React, { useEffect, useRef } from 'react';
import { useHighlight } from '../contexts/HighlightContext';

interface HighlightScannerProps {
  children?: React.ReactNode;
  /** Whether to automatically scan for elements with IDs */
  enabled?: boolean;
}

/**
 * Wraps your application and automatically discovers DOM elements with IDs,
 * registering them as highlightable components.
 */
export const HighlightScanner: React.FC<HighlightScannerProps> = ({ 
  children, 
  enabled = true 
}) => {
  const { registerComponent, unregisterComponent, notifyComponentClick } = useHighlight();
  const registeredIds = useRef<Set<string>>(new Set());
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickHandlers = useRef<Map<string, (e: Event) => void>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const scanAndRegister = () => {
      // Find all elements with IDs
      const elementsWithIds = document.querySelectorAll('[id]');
      const currentIds = new Set<string>();

      elementsWithIds.forEach((element) => {
        const id = element.id;
        if (!id) return;

        // Filter out internal Vite/React elements and highlight-related IDs
        if (id.startsWith('vite-') || 
            id.startsWith('react-') || 
            id.includes('headlessui') ||
            element.hasAttribute('data-highlight-id')) {
          return;
        }

        currentIds.add(id);

        // Skip if already registered
        if (registeredIds.current.has(id)) return;

        // Generate a friendly name from the ID
        const name = id
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // Look for optional data attributes for additional metadata
        const keywords = element.getAttribute('data-highlight-keywords')?.split(',').map(k => k.trim());
        const description = element.getAttribute('data-highlight-description') || undefined;

        console.log('🔍 Auto-registering element:', { id, name, keywords, description });

        // Create click handler for this element
        const clickHandler = (e: Event) => {
          const el = e.currentTarget as HTMLElement;
          if (el.classList.contains('ui-highlighted')) {
            console.log('👆 ID-based element clicked:', id);
            notifyComponentClick(id);
          }
        };

        // Add click listener
        element.addEventListener('click', clickHandler);
        clickHandlers.current.set(id, clickHandler);

        registerComponent({
          id,
          name,
          description,
          keywords: keywords || [id, name.toLowerCase()],
          element: element as HTMLElement,
        });

        registeredIds.current.add(id);
      });

      // Unregister elements that no longer exist
      registeredIds.current.forEach((id) => {
        if (!currentIds.has(id)) {
          console.log('🗑️ Auto-unregistering removed element:', id);
          
          // Remove click listener
          const element = document.getElementById(id);
          const clickHandler = clickHandlers.current.get(id);
          if (element && clickHandler) {
            element.removeEventListener('click', clickHandler);
          }
          clickHandlers.current.delete(id);
          
          unregisterComponent(id);
          registeredIds.current.delete(id);
        }
      });
    };

    // Initial scan with a small delay to ensure DOM is ready
    const initialTimeout = setTimeout(() => {
      scanAndRegister();
    }, 100);

    // Watch for DOM changes with debouncing
    const observer = new MutationObserver(() => {
      // Debounce to prevent excessive scans
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      scanTimeoutRef.current = setTimeout(() => {
        scanAndRegister();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'data-highlight-keywords', 'data-highlight-description'],
    });

    return () => {
      clearTimeout(initialTimeout);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      observer.disconnect();
      
      // Remove all click listeners and unregister
      registeredIds.current.forEach((id) => {
        const element = document.getElementById(id);
        const clickHandler = clickHandlers.current.get(id);
        if (element && clickHandler) {
          element.removeEventListener('click', clickHandler);
        }
        unregisterComponent(id);
      });
      
      registeredIds.current.clear();
      clickHandlers.current.clear();
    };
  }, [enabled, registerComponent, unregisterComponent, notifyComponentClick]);

  return <>{children || null}</>;
};
