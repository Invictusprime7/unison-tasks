/**
 * Utilities for selecting and manipulating HTML elements in the live preview
 */

export interface SelectedElementData {
  tagName: string;
  textContent: string;
  styles: Record<string, string>;
  attributes: Record<string, string>;
  selector: string;
  xpath: string;
}

/**
 * Extract all computed styles from an element
 */
export const extractElementStyles = (element: HTMLElement): Record<string, string> => {
  const computedStyle = window.getComputedStyle(element);
  
  const relevantStyles: Record<string, string> = {
    color: computedStyle.color,
    backgroundColor: computedStyle.backgroundColor,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily,
    fontWeight: computedStyle.fontWeight,
    fontStyle: computedStyle.fontStyle,
    textDecoration: computedStyle.textDecoration,
    textAlign: computedStyle.textAlign,
    padding: computedStyle.padding,
    margin: computedStyle.margin,
    border: computedStyle.border,
    borderRadius: computedStyle.borderRadius,
    width: computedStyle.width,
    height: computedStyle.height,
    display: computedStyle.display,
    opacity: computedStyle.opacity,
  };

  return relevantStyles;
};

/**
 * Generate a unique CSS selector for an element
 */
export const generateSelector = (element: HTMLElement): string => {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.className) {
      const classes = current.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += `.${classes[0]}`;
      }
    }
    
    // Add nth-child if there are siblings
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current);
      if (siblings.length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
};

/**
 * Generate XPath for an element
 */
export const generateXPath = (element: HTMLElement): string => {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let index = 0;
    let sibling = current.previousSibling;

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.nodeName.toLowerCase();
    const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
    path.unshift(part);
    current = current.parentElement;
  }

  return '/' + path.join('/');
};

/**
 * Extract all attributes from an element
 */
export const extractElementAttributes = (element: HTMLElement): Record<string, string> => {
  const attributes: Record<string, string> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  
  return attributes;
};

/**
 * Get selected element data
 */
export const getSelectedElementData = (element: HTMLElement): SelectedElementData => {
  return {
    tagName: element.tagName,
    textContent: element.textContent || "",
    styles: extractElementStyles(element),
    attributes: extractElementAttributes(element),
    selector: generateSelector(element),
    xpath: generateXPath(element),
  };
};

/**
 * Apply styles to an element
 */
export const applyStylesToElement = (element: HTMLElement, styles: Record<string, string>) => {
  Object.entries(styles).forEach(([property, value]) => {
    if (value !== undefined && value !== null) {
      element.style.setProperty(property, value);
    }
  });
};

/**
 * Highlight element with a visual outline
 */
export const highlightElement = (element: HTMLElement, color: string = "#3b82f6") => {
  element.style.outline = `2px solid ${color}`;
  element.style.outlineOffset = "2px";
};

/**
 * Remove highlight from element
 */
export const removeHighlight = (element: HTMLElement) => {
  element.style.outline = "";
  element.style.outlineOffset = "";
};

/**
 * Update code with new element properties
 */
export const updateCodeWithElementChanges = (
  originalCode: string,
  selector: string,
  updates: { styles?: Record<string, string>; textContent?: string; attributes?: Record<string, string> }
): string => {
  let updatedCode = originalCode;

  // For simple cases, try to find and replace text content
  if (updates.textContent !== undefined) {
    // This is a simplified version - would need more robust parsing for production
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch) {
      const tagName = tagMatch[1];
      const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'g');
      updatedCode = updatedCode.replace(regex, (match) => {
        return match.replace(/>(.*?)</, `>${updates.textContent}<`);
      });
    }
  }

  // For styles, we'd need to inject inline styles or update style tags
  if (updates.styles && Object.keys(updates.styles).length > 0) {
    // This would require more sophisticated code parsing
    // For now, we'll inject inline styles
    const styleString = Object.entries(updates.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    
    // Try to add style attribute to matching elements
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch) {
      const tagName = tagMatch[1];
      const regex = new RegExp(`<${tagName}([^>]*)>`, 'g');
      updatedCode = updatedCode.replace(regex, (match, attrs) => {
        if (attrs.includes('style=')) {
          return match.replace(/style="([^"]*)"/, `style="$1; ${styleString}"`);
        } else {
          return `<${tagName}${attrs} style="${styleString}">`;
        }
      });
    }
  }

  return updatedCode;
};
