import { isElementVisible } from './visibility';

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
