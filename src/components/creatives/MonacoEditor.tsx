import React from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Configure Monaco loader to use CDN path (works well in sandboxed iframes)
// Adjust version if needed; keep in sync with @monaco-editor/react peer
loader.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });

// Simple wrapper that normalizes default export shape across bundlers
// and ensures a consistent, working component is rendered.
const MonacoEditor: React.FC<React.ComponentProps<typeof Editor>> = (props) => {
  const Comp: any = (Editor as any)?.default ?? (Editor as any);
  return <Comp {...props} />;
};

export default MonacoEditor;
