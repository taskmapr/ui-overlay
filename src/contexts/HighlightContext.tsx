import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { HighlightableComponent, Walkthrough, WalkthroughStep } from '../types';
import { isElementVisible } from '../utils/visibility';

const WALKTHROUGH_STORAGE_KEY = 'taskmapr-active-walkthrough';

interface HighlightContextType {
  highlightedSelectors: Set<string>;
  highlight: (selector: string, duration?: number) => void;
  unhighlight: (selector: string) => void;
  clearAll: () => void;
  registerComponent: (component: HighlightableComponent) => void;
  unregisterComponent: (id: string) => void;
  findComponent: (query: string) => HighlightableComponent | null;
  highlightComponent: (query: string, duration?: number) => boolean;
  notifyComponentClick: (componentId: string) => void;
  startWalkthrough: (steps: WalkthroughStep[], callbacks?: { onComplete?: () => void; onStepChange?: (stepIndex: number, step: WalkthroughStep) => void }) => string;
  stopWalkthrough: (walkthroughId?: string) => void;
  activeWalkthrough: Walkthrough | null;
  getVisibleComponents: () => HighlightableComponent[];
}

export const HighlightContext = createContext<HighlightContextType | undefined>(undefined);

export const HighlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highlightedSelectors, setHighlightedSelectors] = useState<Set<string>>(new Set());
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [components, setComponents] = useState<Map<string, HighlightableComponent>>(new Map());
  const [activeWalkthrough, setActiveWalkthrough] = useState<Walkthrough | null>(null);
  const currentPathRef = useRef<string>(typeof window !== 'undefined' ? window.location.pathname : '/');

  const highlight = useCallback((selector: string, duration?: number) => {
    console.log('🎯 Highlighting selector:', selector, 'duration:', duration);
    setHighlightedSelectors((prev) => new Set(prev).add(selector));

    // Apply highlight class to matching elements
    const elements = document.querySelectorAll(selector);
    console.log('Found elements:', elements.length, 'for selector:', selector);
    elements.forEach((el) => {
      console.log('Adding highlight to:', el);
      el.classList.add('ui-highlighted');
    });

    // Clear any existing timeout for this selector
    const existingTimeout = timeouts.current.get(selector);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Auto-remove highlight after duration if specified
    if (duration && duration > 0) {
      const newTimeout = setTimeout(() => {
        unhighlight(selector);
      }, duration);
      
      timeouts.current.set(selector, newTimeout);
    }
  }, []);

  const unhighlight = useCallback((selector: string) => {
    setHighlightedSelectors((prev) => {
      const updated = new Set(prev);
      updated.delete(selector);
      return updated;
    });

    // Remove highlight class from matching elements
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.classList.remove('ui-highlighted');
    });

    // Clear timeout if exists
    const existingTimeout = timeouts.current.get(selector);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeouts.current.delete(selector);
    }
  }, []);

  const clearAll = useCallback(() => {
    setHighlightedSelectors((prev) => {
      // Remove all highlight classes
      prev.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          el.classList.remove('ui-highlighted');
        });
      });
      return new Set();
    });

    // Clear all timeouts
    timeouts.current.forEach((timeout) => clearTimeout(timeout));
    timeouts.current.clear();
  }, []);

  const registerComponent = useCallback((component: HighlightableComponent) => {
    console.log('📝 Registering component:', component.name, component.id);
    setComponents((prev) => {
      // Only update if the component is different to prevent unnecessary re-renders
      const existing = prev.get(component.id);
      if (existing?.element === component.element && 
          existing?.name === component.name &&
          JSON.stringify(existing?.keywords) === JSON.stringify(component.keywords)) {
        return prev; // No change, return same reference
      }
      const updated = new Map(prev);
      updated.set(component.id, component);
      return updated;
    });
  }, []);

  const unregisterComponent = useCallback((id: string) => {
    console.log('🗑️ Unregistering component:', id);
    setComponents((prev) => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  }, []);

  // Normalize strings for fuzzy matching - handles hyphens, underscores, spaces
  const normalizeForMatching = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[-_\s]+/g, ' ')  // Convert hyphens, underscores, spaces to single space
      .replace(/[^a-z0-9\s]/g, '')  // Remove special characters except spaces
      .trim();
  };

  const findComponent = useCallback((query: string): HighlightableComponent | null => {
    const normalizedQuery = normalizeForMatching(query);
    const comps = componentsRef.current;
    
    console.log('🔍 Finding component for query:', query, '(normalized:', normalizedQuery + ')');
    
    // Try exact match on normalized ID
    for (const [id, component] of comps.entries()) {
      if (normalizeForMatching(id) === normalizedQuery) {
        console.log('✅ Found by normalized ID:', id);
        return component;
      }
    }
    
    // Try exact match on normalized name
    for (const component of comps.values()) {
      if (normalizeForMatching(component.name) === normalizedQuery) {
        console.log('✅ Found by normalized name:', component.name);
        return component;
      }
    }

    // Try exact match on original casing (legacy support)
    const exactMatch = comps.get(query);
    if (exactMatch) {
      console.log('✅ Found by exact ID match:', query);
      return exactMatch;
    }

    // Try partial match on normalized name
    for (const component of comps.values()) {
      const normalizedName = normalizeForMatching(component.name);
      if (normalizedName.includes(normalizedQuery)) {
        console.log('✅ Found by partial normalized name match:', component.name);
        return component;
      }
    }

    // Try normalized keyword exact match
    for (const component of comps.values()) {
      if (component.keywords?.some((kw) => normalizeForMatching(kw) === normalizedQuery)) {
        console.log('✅ Found by normalized keyword match:', component.name);
        return component;
      }
    }

    // Try multi-word matching with normalized words
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length > 1) {
      for (const component of comps.values()) {
        const componentKeywords = component.keywords?.map(kw => normalizeForMatching(kw)) || [];
        const nameWords = normalizeForMatching(component.name).split(/\s+/);
        const idWords = normalizeForMatching(component.id).split(/\s+/);
        const allWords = [...componentKeywords, ...nameWords, ...idWords];
        
        // Check if all query words are in the component's keywords/name/id
        const allWordsMatch = queryWords.every(qWord => 
          allWords.some(cWord => cWord.includes(qWord) || qWord.includes(cWord))
        );
        
        if (allWordsMatch) {
          console.log('✅ Found by multi-word match:', component.name);
          return component;
        }
      }
    }

    // Try keyword partial match (normalized)
    for (const component of comps.values()) {
      if (component.keywords?.some((kw) => normalizeForMatching(kw).includes(normalizedQuery))) {
        console.log('✅ Found by partial keyword match:', component.name);
        return component;
      }
    }

    // Try description match (normalized)
    for (const component of comps.values()) {
      if (component.description && normalizeForMatching(component.description).includes(normalizedQuery)) {
        console.log('✅ Found by description match:', component.name);
        return component;
      }
    }

    console.warn('❌ No component found for query:', query);
    return null;
  }, []);

  const highlightComponent = useCallback((query: string, duration?: number): boolean => {
    const component = findComponent(query);
    if (!component) {
      console.warn('❌ Component not found for query:', query);
      return false;
    }

    console.log('✅ Found component:', component.name, 'for query:', query);
    
    // Generate a unique selector using data attribute
    component.element.setAttribute('data-highlight-id', component.id);
    const selector = `[data-highlight-id="${component.id}"]`;
    highlight(selector, duration);
    return true;
  }, [findComponent, highlight]);

  // Use a ref to track the active walkthrough for callbacks
  const activeWalkthroughRef = useRef<Walkthrough | null>(null);
  
  useEffect(() => {
    activeWalkthroughRef.current = activeWalkthrough;
  }, [activeWalkthrough]);

  const progressWalkthroughRef = useRef<() => void>();

  const componentsRef = useRef<Map<string, HighlightableComponent>>(new Map());
  
  useEffect(() => {
    componentsRef.current = components;
  }, [components]);

  const notifyComponentClick = useCallback((componentId: string) => {
    console.log('🖱️ Component clicked:', componentId);
    
    // Call the component's click handler if it exists
    const component = componentsRef.current.get(componentId);
    if (component?.onHighlightClick) {
      component.onHighlightClick();
    }

    // Progress walkthrough if active
    const wt = activeWalkthroughRef.current;
    if (wt) {
      const currentStep = wt.steps[wt.currentStepIndex];
      const currentComponent = findComponent(currentStep.query);
      
      // Check if the clicked component matches the current step
      if (currentComponent?.id === componentId && currentStep.waitForClick !== false) {
        console.log('✅ Walkthrough step completed by click');
        progressWalkthroughRef.current?.();
      }
    }
  }, [findComponent]);

  const progressWalkthrough = useCallback(() => {
    const wt = activeWalkthroughRef.current;
    if (!wt) return;

    const nextIndex = wt.currentStepIndex + 1;
    
    // Clear current highlight
    clearAll();

    // Check if walkthrough is complete
    if (nextIndex >= wt.steps.length) {
      console.log('✅ Walkthrough complete!');
      localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
      wt.onComplete?.();
      setActiveWalkthrough(null);
      return;
    }

    // Move to next step
    const nextStep = wt.steps[nextIndex];
    const updatedWalkthrough = {
      ...wt,
      currentStepIndex: nextIndex,
    };
    
    setActiveWalkthrough(updatedWalkthrough);
    
    // Save to localStorage
    saveWalkthroughToStorage(updatedWalkthrough);
    
    // Check if we need to navigate to a different page
    const currentPath = currentPathRef.current;
    const targetPage = nextStep.page || '/';
    
    if (targetPage !== currentPath) {
      console.log('🧭 Navigating to', targetPage, 'for next step');
      // Don't highlight yet - wait for navigation to complete
      // The useEffect will handle highlighting after navigation
      return;
    }
    
    // Notify about step change
    wt.onStepChange?.(nextIndex, nextStep);
    
    // Highlight the next component
    const waitForClick = nextStep.waitForClick !== false;
    const duration = waitForClick ? undefined : nextStep.duration;
    
    console.log('📍 Walkthrough step', nextIndex + 1, 'of', wt.steps.length);
    const success = highlightComponent(nextStep.query, duration);
    
    if (!success) {
      console.warn('⚠️ Could not find component for step:', nextStep.query);
      // Auto-progress if component not found
      setTimeout(() => progressWalkthroughRef.current?.(), 1000);
    } else if (!waitForClick && duration) {
      // Auto-progress after duration if not waiting for click
      setTimeout(() => progressWalkthroughRef.current?.(), duration);
    }
  }, [clearAll, highlightComponent]);
  
  // Keep ref up to date
  progressWalkthroughRef.current = progressWalkthrough;

  const saveWalkthroughToStorage = (walkthrough: Walkthrough) => {
    try {
      localStorage.setItem(WALKTHROUGH_STORAGE_KEY, JSON.stringify({
        id: walkthrough.id,
        steps: walkthrough.steps,
        currentStepIndex: walkthrough.currentStepIndex,
      }));
    } catch (error) {
      console.error('Failed to save walkthrough to localStorage:', error);
    }
  };

  const loadWalkthroughFromStorage = (): { id: string; steps: WalkthroughStep[]; currentStepIndex: number } | null => {
    try {
      const saved = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load walkthrough from localStorage:', error);
      return null;
    }
  };

  const startWalkthrough = useCallback((steps: WalkthroughStep[], callbacks?: { onComplete?: () => void; onStepChange?: (stepIndex: number, step: WalkthroughStep) => void }): string => {
    console.log('🚀 Starting walkthrough with', steps.length, 'steps');
    
    // Stop any existing walkthrough
    if (activeWalkthroughRef.current) {
      clearAll();
      setActiveWalkthrough(null);
    }

    const walkthroughId = `walkthrough-${Date.now()}`;
    const walkthrough: Walkthrough = {
      id: walkthroughId,
      steps,
      currentStepIndex: 0,
      onComplete: callbacks?.onComplete,
      onStepChange: callbacks?.onStepChange,
    };

    setActiveWalkthrough(walkthrough);
    saveWalkthroughToStorage(walkthrough);

    // Start first step
    const firstStep = steps[0];
    const currentPath = currentPathRef.current;
    const targetPage = firstStep.page || '/';
    
    // Check if we need to navigate to a different page
    if (targetPage !== currentPath) {
      console.log('🧭 Navigating to', targetPage, 'for first step');
      // Don't highlight yet - wait for navigation to complete
      return walkthroughId;
    }
    
    callbacks?.onStepChange?.(0, firstStep);
    
    const waitForClick = firstStep.waitForClick !== false;
    const duration = waitForClick ? undefined : firstStep.duration;
    
    setTimeout(() => {
      const success = highlightComponent(firstStep.query, duration);
      if (!success) {
        console.warn('⚠️ Could not find component for first step:', firstStep.query);
      } else if (!waitForClick && duration) {
        // Auto-progress after duration if not waiting for click
        setTimeout(() => progressWalkthroughRef.current?.(), duration);
      }
    }, 100);

    return walkthroughId;
  }, [clearAll, highlightComponent]);

  const getVisibleComponents = useCallback((): HighlightableComponent[] => {
    const visibleComponents: HighlightableComponent[] = [];
    
    for (const component of componentsRef.current.values()) {
      if (isElementVisible(component.element)) {
        visibleComponents.push(component);
      }
    }
    
    return visibleComponents;
  }, []);

  const stopWalkthrough = useCallback((walkthroughId?: string) => {
    const wt = activeWalkthroughRef.current;
    if (walkthroughId && wt?.id !== walkthroughId) {
      return; // Not the active walkthrough
    }
    
    console.log('🛑 Stopping walkthrough');
    localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
    clearAll();
    setActiveWalkthrough(null);
  }, [clearAll]);

  // Load saved walkthrough on mount and handle page changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    currentPathRef.current = currentPath;

    // Try to resume a saved walkthrough
    const saved = loadWalkthroughFromStorage();
    if (saved && !activeWalkthroughRef.current) {
      console.log('📂 Found saved walkthrough, attempting to resume...');
      
      const currentStep = saved.steps[saved.currentStepIndex];
      const targetPage = currentStep.page || '/';
      
      // Only resume if we're on the correct page for the current step
      if (targetPage === currentPath) {
        console.log('✅ Resuming walkthrough at step', saved.currentStepIndex + 1);
        
        // Create a minimal walkthrough object (callbacks won't be restored)
        const resumedWalkthrough: Walkthrough = {
          id: saved.id,
          steps: saved.steps,
          currentStepIndex: saved.currentStepIndex,
        };
        
        setActiveWalkthrough(resumedWalkthrough);
        
        // Highlight current step after a delay to ensure DOM is ready
        setTimeout(() => {
          const waitForClick = currentStep.waitForClick !== false;
          const duration = waitForClick ? undefined : currentStep.duration;
          
          const success = highlightComponent(currentStep.query, duration);
          if (!success) {
            console.warn('⚠️ Could not find component for resumed step:', currentStep.query);
          } else if (!waitForClick && duration) {
            setTimeout(() => progressWalkthroughRef.current?.(), duration);
          }
        }, 500);
      } else {
        console.log('ℹ️ Saved walkthrough is for a different page, keeping in storage');
      }
    }
  }, [highlightComponent]);

  // Watch for path changes and handle multi-page walkthroughs
  useEffect(() => {
    const handleLocationChange = () => {
      const newPath = window.location.pathname;
      const oldPath = currentPathRef.current;
      
      if (newPath !== oldPath) {
        console.log('🧭 Path changed from', oldPath, 'to', newPath);
        currentPathRef.current = newPath;
        
        const wt = activeWalkthroughRef.current;
        if (wt) {
          const currentStep = wt.steps[wt.currentStepIndex];
          const targetPage = currentStep.page || '/';
          
          // If we've arrived at the target page, highlight the component
          if (newPath === targetPage) {
            console.log('✅ Arrived at target page, highlighting component');
            
            // Clear any existing highlights
            clearAll();
            
            // Notify about step change
            wt.onStepChange?.(wt.currentStepIndex, currentStep);
            
            // Highlight after a delay to ensure DOM is ready
            setTimeout(() => {
              const waitForClick = currentStep.waitForClick !== false;
              const duration = waitForClick ? undefined : currentStep.duration;
              
              const success = highlightComponent(currentStep.query, duration);
              if (!success) {
                console.warn('⚠️ Could not find component after navigation:', currentStep.query);
              } else if (!waitForClick && duration) {
                setTimeout(() => progressWalkthroughRef.current?.(), duration);
              }
            }, 500);
          }
        }
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange);
    
    // Also check periodically for SPA navigation that doesn't trigger popstate
    const interval = setInterval(handleLocationChange, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [clearAll, highlightComponent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, []);

  return (
    <HighlightContext.Provider value={{ 
      highlightedSelectors, 
      highlight, 
      unhighlight, 
      clearAll,
      registerComponent,
      unregisterComponent,
      findComponent,
      highlightComponent,
      notifyComponentClick,
      startWalkthrough,
      stopWalkthrough,
      activeWalkthrough,
      getVisibleComponents
    }}>
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlightOptional = () => {
  return useContext(HighlightContext);
};

export const useHighlight = () => {
  const context = useContext(HighlightContext);
  if (!context) {
    throw new Error('useHighlight must be used within HighlightProvider');
  }
  return context;
};
