import { useMemo, useRef, useEffect } from 'react';
import type { Project } from '@/types/project';

export function Canvas({ project }: { project: Project }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    if (project.engine !== 'static-html') {
      return '<!doctype html><body>Renderer for this engine not implemented yet.</body>';
    }
    const html = project.files['/index.html'] ?? '<body>No /index.html</body>';
    const css  = project.files['/styles.css'] ?? '';
    const js   = project.files['/script.js'] ?? '';
    return `<!doctype html><html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style id="app-style">${css}</style></head>
<body>
${html}
<script>
window.addEventListener('message', (e) => {
  const d = e.data||{};
  if(d.type==='fs:update' && d.path==='/styles.css'){
    const s = document.getElementById('app-style'); if(s) s.textContent = d.content;
  }
  if(d.type==='fs:update' && d.path==='/index.html'){
    document.body.innerHTML = d.content + '<script>'+(${JSON.stringify(js)})+'</'+'script>';
  }
  if(d.type==='fs:update' && d.path==='/script.js'){
    try { eval(d.content); } catch (e) { console.error(e); }
  }
});
</script>
<script>${js}</script>
</body></html>`;
  }, [project]);

  // optional: expose a send method to parent via window
  useEffect(() => { /* no-op */ }, []);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full bg-white"
      sandbox="allow-scripts allow-forms allow-pointer-lock"
      srcDoc={srcDoc}
    />
  );
}