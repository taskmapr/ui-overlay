import { useEffect, useRef } from 'react';
import { useHighlight } from '../contexts/HighlightContext';

interface UseHighlightableOptions {
  name: string;
  description?: string;
  keywords?: string[];
  enabled?: boolean;
  onClick?: () => void;
}

/**
 * Hook that registers a component to be highlightable via the chat overlay
 * @param options Configuration for the highlightable component
 * @returns A ref to attach to the component's DOM element
 */
export const useHighlightable = <T extends HTMLElement = HTMLElement>(options: UseHighlightableOptions) => {
  const { name, description, keywords, enabled = true, onClick } = options;
  const elementRef = useRef<T>(null);
  const { registerComponent, unregisterComponent, notifyComponentClick } = useHighlight();
  
  // Generate a stable ID based on the name
  const id = useRef(`highlightable-${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Stable reference for keywords to prevent infinite loops
  const keywordsStr = keywords ? JSON.stringify(keywords) : '';

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    const parsedKeywords = keywordsStr ? JSON.parse(keywordsStr) : undefined;
    
    // Click handler for the element
    const handleClick = () => {
      // Check if element is highlighted
      if (element.classList.contains('ui-highlighted')) {
        console.log('👆 Highlighted element clicked:', name);
        notifyComponentClick(id);
        onClick?.();
      }
    };

    const component = {
      id,
      name,
      description,
      keywords: parsedKeywords,
      element,
      onHighlightClick: () => {
        onClick?.();
      },
    };

    // Add click listener
    element.addEventListener('click', handleClick);
    
    registerComponent(component);

    return () => {
      element.removeEventListener('click', handleClick);
      unregisterComponent(id);
    };
  }, [id, name, description, keywordsStr, enabled, onClick, registerComponent, unregisterComponent, notifyComponentClick]);

  return elementRef;
};
