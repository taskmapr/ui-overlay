import { isElementVisible } from './visibility';

export interface VisibleElementSnapshot {
  /** The HTML id attribute */
  id: string;
  /** The element's tag name (e.g., 'div', 'button', 'input') */
  tagName: string;
  /** The element's text content (truncated to 200 chars) */
  textContent: string;
  /** Array of CSS class names */
  classNames: string[];
  /** The element's role attribute if present */
  role?: string;
  /** The element's aria-label if present */
  ariaLabel?: string;
  /** The element's aria-describedby if present */
  ariaDescribedBy?: string;
  /** The element's placeholder if it's an input */
  placeholder?: string;
  /** The element's value if it's an input/textarea */
  value?: string;
  /** The element's type if it's an input/button */
  type?: string;
  /** Position of the element relative to the viewport */
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Whether the element is interactive (button, link, input, etc.) */
  isInteractive: boolean;
}

/**
 * Get all visible elements with HTML id attributes
 * @returns Array of objects containing the HTML id and the element
 */
export const getVisibleElementIds = (): Array<{ id: string; element: HTMLElement }> => {
  const visibleIds: Array<{ id: string; element: HTMLElement }> = [];
  
  // Query all elements with an id attribute
  const elementsWithIds = document.querySelectorAll<HTMLElement>('[id]');
  
  elementsWithIds.forEach((element) => {
    const htmlId = element.id;
    if (htmlId && isElementVisible(element)) {
      visibleIds.push({
        id: htmlId,
        element,
      });
    }
  });
  
  return visibleIds;
};

/**
 * Get just the HTML id strings of visible elements
 * @returns Array of HTML id attribute values
 */
export const getVisibleHtmlIds = (): string[] => {
  return getVisibleElementIds().map(item => item.id);
};

/**
 * Truncate text to a maximum length
 */
const truncateText = (text: string, maxLength: number = 200): string => {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > maxLength 
    ? trimmed.slice(0, maxLength) + '...' 
    : trimmed;
};

/**
 * Check if an element is interactive
 */
const isInteractiveElement = (element: HTMLElement): boolean => {
  const interactiveTags = ['button', 'a', 'input', 'textarea', 'select'];
  const tagName = element.tagName.toLowerCase();
  
  if (interactiveTags.includes(tagName)) return true;
  if (element.getAttribute('role') === 'button') return true;
  if (element.hasAttribute('onclick')) return true;
  if (element.tabIndex >= 0) return true;
  
  return false;
};

/**
 * Get a rich snapshot of all visible elements with HTML id attributes
 * @returns Array of element snapshots with detailed metadata
 */
export const getVisibleElementSnapshots = (): VisibleElementSnapshot[] => {
  const snapshots: VisibleElementSnapshot[] = [];
  const elementsWithIds = getVisibleElementIds();
  
  elementsWithIds.forEach(({ id, element }) => {
    const rect = element.getBoundingClientRect();
    const tagName = element.tagName.toLowerCase();
    
    // Get text content
    let textContent = '';
    if (element.textContent) {
      textContent = truncateText(element.textContent);
    }
    
    // Build the snapshot
    const snapshot: VisibleElementSnapshot = {
      id,
      tagName,
      textContent,
      classNames: Array.from(element.classList),
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      isInteractive: isInteractiveElement(element),
    };
    
    // Add optional attributes
    const role = element.getAttribute('role');
    if (role) snapshot.role = role;
    
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) snapshot.ariaLabel = ariaLabel;
    
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) snapshot.ariaDescribedBy = ariaDescribedBy;
    
    // Input-specific attributes
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (element.placeholder) snapshot.placeholder = element.placeholder;
      if (element.value) snapshot.value = truncateText(element.value, 100);
    }
    
    if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
      if (element.type) snapshot.type = element.type;
    }
    
    snapshots.push(snapshot);
  });
  
  return snapshots;
};
