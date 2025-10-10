/**
 * Advanced Code Bundler
 * Handles TypeScript, JavaScript, React/JSX, and asset resolution with Babel transpilation
 */

import * as Babel from '@babel/standalone';

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
  result.hasTypeScript = code.includes('interface ') || code.includes('type ') || code.includes(': React.') || code.includes(': string') || code.includes(': number');
  result.hasReact = code.includes('React') || code.includes('jsx') || code.includes('tsx') || code.includes('useState') || code.includes('useEffect');

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
  } else if (result.hasReact || result.hasTypeScript) {
    // React/TypeScript component - transpile with Babel
    try {
      const transpiled = transpileReactWithBabel(code);
      result.javascript = transpiled.javascript;
      result.html = transpiled.html;
      result.css = transpiled.css;
    } catch (error) {
      console.error('Babel transpilation failed:', error);
      // Fallback to basic transpilation
      result.javascript = transpileTypeScript(code);
    }
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
 * Transpile React/TypeScript with Babel
 */
function transpileReactWithBabel(code: string): { javascript: string; html: string; css: string } {
  try {
    // Clean up the code
    let cleanCode = code.trim();

    // Remove ALL import statements (they won't work in iframe anyway)
    cleanCode = cleanCode.replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '');
    cleanCode = cleanCode.replace(/import\s+['"][^'"]+['"];?\n?/g, '');
    
    // Remove ALL export statements BEFORE transpilation
    cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
    cleanCode = cleanCode.replace(/export\s+/g, '');
    
    // Wrap if it's just a component without wrapper
    if (!cleanCode.includes('ReactDOM') && !cleanCode.includes('render')) {
      // Extract component name if possible
      const componentMatch = cleanCode.match(/(?:function|const)\s+(\w+)/);
      const componentName = componentMatch ? componentMatch[1] : 'App';
      
      cleanCode = `
${cleanCode}

// Auto-render component
if (typeof window !== 'undefined' && document.getElementById('root')) {
  const root = document.getElementById('root');
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  
  if (root && ReactDOM && typeof ${componentName} !== 'undefined') {
    ReactDOM.render(React.createElement(${componentName}, null), root);
  }
}
`;
    }

    // Transpile with Babel
    const babelResult = Babel.transform(cleanCode, {
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { isTSX: true, allExtensions: true }]
      ],
      filename: 'component.tsx',
    });

    let transpiledCode = babelResult.code || '';
    
    // Post-process: Remove any remaining export statements that Babel might have left
    transpiledCode = transpiledCode.replace(/export\s+default\s+/g, '');
    transpiledCode = transpiledCode.replace(/export\s+\{[^}]*\};?\n?/g, '');
    transpiledCode = transpiledCode.replace(/export\s+/g, '');

    // Extract CSS from styled-components or template literals if present
    let css = '';
    const cssMatch = cleanCode.match(/const\s+styles?\s*=\s*`([\s\S]*?)`;/);
    if (cssMatch) {
      css = cssMatch[1].trim();
    }

    return {
      javascript: transpiledCode,
      html: '<div id="root"></div>',
      css,
    };
  } catch (error) {
    console.error('Babel transpilation error:', error);
    throw error;
  }
}

/**
 * Basic TypeScript to JavaScript transpilation
 */
function transpileTypeScript(code: string): string {
  // Try Babel first for better compatibility
  try {
    // Remove imports and exports BEFORE Babel
    let cleanCode = code
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
      .replace(/import\s+['"][^'"]+['"];?\n?/g, '')
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '');

    const result = Babel.transform(cleanCode, {
      presets: [
        ['typescript', { allExtensions: true }]
      ],
      filename: 'code.ts',
    });
    
    let transpiledCode = result.code || cleanCode;
    
    // Post-process: Remove any remaining exports
    transpiledCode = transpiledCode.replace(/export\s+default\s+/g, '');
    transpiledCode = transpiledCode.replace(/export\s+\{[^}]*\};?\n?/g, '');
    transpiledCode = transpiledCode.replace(/export\s+/g, '');
    
    return transpiledCode;
  } catch (error) {
    console.warn('Babel transpilation failed, using fallback:', error);
    // Fallback to regex-based transpilation
    let js = code
      .replace(/:\s*[\w<>[\]|&]+(\s*[=,;)])/g, '$1') // Remove type annotations
      .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
      .replace(/<[\w<>[\]|&, ]+>/g, '') // Remove generic type parameters
      .replace(/as\s+[\w<>[\]|&]+/g, '') // Remove type assertions
      .replace(/!\./, '.') // Remove non-null assertions
      .replace(/\?\./g, '?.'); // Keep optional chaining

    // Remove import statements
    js = js.replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '');
    js = js.replace(/import\s+['"][^'"]+['"];?\n?/g, '');

    // Remove ALL export statements
    js = js.replace(/export\s+default\s+/g, '');
    js = js.replace(/export\s+\{[^}]*\};?\n?/g, '');
    js = js.replace(/export\s+/g, '');

    return js.trim();
  }
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
