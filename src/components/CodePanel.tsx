import Editor from '@monaco-editor/react';
import type { Project } from '@/types/project';
import { useMemo, useRef } from 'react';

function langFromPath(p: string) {
  if (p.endsWith('.html')) return 'html';
  if (p.endsWith('.css')) return 'css';
  if (p.endsWith('.ts') || p.endsWith('.tsx')) return 'typescript';
  if (p.endsWith('.js') || p.endsWith('.jsx')) return 'javascript';
  return 'plaintext';
}

export function CodePanel({
  project,
  onChange
}: {
  project: Project;
  onChange: (path: string, content: string) => void;
}) {
  const activePath = useMemo(() => project.entry || '/index.html', [project.entry]);
  const iframe = useRef<HTMLIFrameElement | null>(null);

  // Find the iframe rendered by <Canvas/> (simplest approach)
  // Better: pass a ref from parent.
  setTimeout(() => {
    iframe.current = document.querySelector('iframe');
  }, 0);

  const handleChange = (value?: string) => {
    const content = value ?? '';
    onChange(activePath, content);
    iframe.current?.contentWindow?.postMessage({ type: 'fs:update', path: activePath, content }, '*');
  };

  return (
    <div className="h-[calc(100vh-3rem)]">
      <div className="p-2 text-sm font-medium border-b">{activePath}</div>
      <Editor
        height="100%"
        language={langFromPath(activePath)}
        value={project.files[activePath]}
        onChange={handleChange}
        options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
      />
    </div>
  );
}