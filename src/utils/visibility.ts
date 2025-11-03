/**
 * Check if an element is visible in the viewport
 * Uses getBoundingClientRect to determine visibility
 */
export const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  
  // Check if element has any visible area (partial visibility)
  const hasVisibleArea = (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom > 0 &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.right > 0
  );
  
  // Check computed style for visibility and display
  const style = window.getComputedStyle(element);
  const isStyleVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
  
  return hasVisibleArea && isStyleVisible;
};

/**
 * Check if an element is fully visible in the viewport
 */
export const isElementFullyVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  
  const style = window.getComputedStyle(element);
  const isStyleVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
    isStyleVisible
  );
};
