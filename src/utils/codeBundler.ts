/**
 * Advanced Code Bundler
 * Handles TypeScript, JavaScript, imports, and asset resolution
 */

export interface BundledCode {
  html: string;
  css: string;
  javascript: string;
  hasReact: boolean;
  hasTypeScript: boolean;
  dependencies: string[];
}

/**
 * Parse and bundle code for iframe execution
 */
export function bundleCode(code: string): BundledCode {
  const result: BundledCode = {
    html: '',
    css: '',
    javascript: '',
    hasReact: false,
    hasTypeScript: false,
    dependencies: [],
  };

  // Detect code type
  result.hasTypeScript = code.includes(': ') && (code.includes('interface') || code.includes('type '));
  result.hasReact = code.includes('React') || code.includes('jsx') || code.includes('tsx');

  // Extract imports
  const imports = extractImports(code);
  result.dependencies = imports;

  // Parse based on format
  if (code.includes('```html')) {
    parseHTMLBlocks(code, result);
  } else if (code.includes('```jsx') || code.includes('```tsx')) {
    parseReactCode(code, result);
  } else if (code.includes('```javascript') || code.includes('```typescript')) {
    parseScriptCode(code, result);
  } else if (code.includes('<html') || code.includes('<!DOCTYPE')) {
    parseRawHTML(code, result);
  } else if (code.includes('function') || code.includes('const ') || code.includes('class ')) {
    // Plain JS/TS code
    result.javascript = transpileTypeScript(code);
  } else {
    // Assume HTML
    result.html = code;
  }

  return result;
}

/**
 * Extract import statements
 */
function extractImports(code: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Parse HTML code blocks
 */
function parseHTMLBlocks(code: string, result: BundledCode): void {
  // Extract HTML
  const htmlMatch = code.match(/```html\n([\s\S]*?)```/);
  if (htmlMatch) {
    result.html = htmlMatch[1].trim();
  }

  // Extract CSS
  const cssMatch = code.match(/```css\n([\s\S]*?)```/);
  if (cssMatch) {
    result.css = cssMatch[1].trim();
  } else {
    // Look for inline style tags
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
      result.css = styleMatch[1].trim();
    }
  }

  // Extract JavaScript
  const jsMatch = code.match(/```(?:javascript|js)\n([\s\S]*?)```/);
  if (jsMatch) {
    result.javascript = jsMatch[1].trim();
  } else {
    // Look for inline script tags
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptMatch) {
      result.javascript = scriptMatch[1].trim();
    }
  }
}

/**
 * Parse React/JSX code
 */
function parseReactCode(code: string, result: BundledCode): void {
  const blockMatch = code.match(/```(?:jsx|tsx)\n([\s\S]*?)```/);
  const rawCode = blockMatch ? blockMatch[1].trim() : code;

  // Remove imports
  let cleanCode = rawCode.replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '');

  // Extract component
  const componentMatch = cleanCode.match(/(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\([^)]*\)\s*{([\s\S]*?)return\s*\(([\s\S]*?)\);?\s*}/);
  
  if (componentMatch) {
    const jsx = componentMatch[3].trim();
    result.html = convertJSXToHTML(jsx);
  } else {
    // Try to find JSX in return statement
    const returnMatch = cleanCode.match(/return\s*\(([\s\S]*?)\);?/);
    if (returnMatch) {
      result.html = convertJSXToHTML(returnMatch[1].trim());
    }
  }

  // Extract styles from styled components or inline styles
  const styleMatch = cleanCode.match(/const\s+styles\s*=\s*`([\s\S]*?)`;/);
  if (styleMatch) {
    result.css = styleMatch[1].trim();
  }
}

/**
 * Parse JavaScript/TypeScript code
 */
function parseScriptCode(code: string, result: BundledCode): void {
  const blockMatch = code.match(/```(?:javascript|typescript|js|ts)\n([\s\S]*?)```/);
  const rawCode = blockMatch ? blockMatch[1].trim() : code;

  result.javascript = transpileTypeScript(rawCode);
}

/**
 * Parse raw HTML document
 */
function parseRawHTML(code: string, result: BundledCode): void {
  result.html = code;

  // Extract embedded styles
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    result.css = styleMatch[1].trim();
  }

  // Extract embedded scripts
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    result.javascript = scriptMatch[1].trim();
  }
}

/**
 * Convert JSX to HTML
 */
function convertJSXToHTML(jsx: string): string {
  return jsx
    .replace(/className=/g, 'class=')
    .replace(/htmlFor=/g, 'for=')
    .replace(/onClick=/g, 'onclick=')
    .replace(/onChange=/g, 'onchange=')
    .replace(/onSubmit=/g, 'onsubmit=')
    .replace(/\{(['"])(.*?)\1\}/g, '$2') // Remove simple string expressions
    .replace(/\{(\w+)\}/g, '$1') // Replace simple variable expressions
    .replace(/<>/g, '<div>') // Replace fragments
    .replace(/<\/>/g, '</div>');
}

/**
 * Basic TypeScript to JavaScript transpilation
 */
function transpileTypeScript(code: string): string {
  // Remove type annotations
  let js = code
    .replace(/:\s*\w+(\[\])?(\s*[=,;)])/g, '$2') // Remove simple type annotations
    .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
    .replace(/<\w+>/g, '') // Remove generic type parameters
    .replace(/as\s+\w+/g, '') // Remove type assertions
    .replace(/!\./, '.') // Remove non-null assertions
    .replace(/\?\./g, '?.'); // Keep optional chaining

  // Remove import statements
  js = js.replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '');

  // Remove export statements
  js = js.replace(/export\s+(default\s+)?/g, '');

  return js.trim();
}

/**
 * Resolve asset paths
 */
export function resolveAssetPath(path: string): string {
  // Handle relative paths
  if (path.startsWith('./') || path.startsWith('../')) {
    return path;
  }

  // Handle absolute paths
  if (path.startsWith('/')) {
    return path;
  }

  // Handle URLs
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Handle data URLs
  if (path.startsWith('data:')) {
    return path;
  }

  // Default: treat as relative
  return './' + path;
}

/**
 * Extract image sources from code
 */
export function extractImageSources(code: string): string[] {
  const images: string[] = [];
  
  // HTML img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(code)) !== null) {
    images.push(match[1]);
  }

  // CSS background images
  const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(code)) !== null) {
    images.push(match[1]);
  }

  // JSX image imports
  const jsxImgRegex = /import\s+\w+\s+from\s+["']([^"']+\.(?:png|jpg|jpeg|gif|svg|webp))["']/gi;
  while ((match = jsxImgRegex.exec(code)) !== null) {
    images.push(match[1]);
  }

  return images;
}
