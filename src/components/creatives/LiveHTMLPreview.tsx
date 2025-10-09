import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface LiveHTMLPreviewProps {
  html: string;
  css: string;
  javascript?: string;
  className?: string;
  autoRefresh?: boolean;
}

export const LiveHTMLPreview: React.FC<LiveHTMLPreviewProps> = ({
  html,
  css,
  javascript = '',
  className,
  autoRefresh = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const updateTimerRef = useRef<NodeJS.Timeout>();

  const renderPreview = () => {
    if (!iframeRef.current) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      // Build complete HTML document
      const completeHTML = buildHTMLDocument(html, css, javascript);

      // Write to iframe
      iframeDoc.open();
      iframeDoc.write(completeHTML);
      iframeDoc.close();

      // Set up error listener in iframe
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener('error', (e) => {
          console.error('Preview runtime error:', e);
          setStatus('error');
          setErrorMessage(e.error?.message || e.message || 'Runtime error');
        });
      }

      setTimeout(() => setStatus('success'), 300);
    } catch (err) {
      console.error('Preview render error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to render');
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;

    // Debounce updates
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    updateTimerRef.current = setTimeout(() => {
      renderPreview();
    }, 300);

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [html, css, javascript, autoRefresh]);

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Status indicator */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        {status === 'loading' && (
          <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border flex items-center gap-1.5 text-xs">
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            <span className="text-muted-foreground">Rendering...</span>
          </div>
        )}
        {status === 'success' && (
          <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-muted-foreground">Live</span>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-destructive/10 backdrop-blur-sm px-2 py-1 rounded-md border border-destructive/20 flex items-center gap-1.5 text-xs max-w-xs">
            <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
            <span className="text-destructive truncate">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Preview iframe */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 bg-white"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      />
    </div>
  );
};

/**
 * Build complete HTML document with embedded styles and scripts
 */
function buildHTMLDocument(html: string, css: string, javascript: string): string {
  // Clean and prepare HTML
  let bodyContent = html.trim();
  
  // If HTML already contains doctype and html tags, use it as-is (but update styles)
  if (bodyContent.toLowerCase().includes('<!doctype') || bodyContent.toLowerCase().includes('<html')) {
    // Extract existing styles if any
    const existingStyles = bodyContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const allStyles = existingStyles.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n') + '\n' + css;
    
    // Remove old style tags and add new consolidated one
    bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    bodyContent = bodyContent.replace('</head>', `<style>${allStyles}</style>\n</head>`);
    
    // Add script if provided
    if (javascript) {
      bodyContent = bodyContent.replace('</body>', `<script>${javascript}</script>\n</body>`);
    }
    
    return bodyContent;
  }

  // Build from scratch
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Live Preview</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      padding: 20px;
      min-height: 100vh;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    button {
      cursor: pointer;
    }
    
    /* User styles */
    ${css}
  </style>
  
  <script>
    // Global error handler
    window.addEventListener('error', function(event) {
      console.error('Preview Error:', event.error || event);
      
      // Create error display
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = \`
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        background: #fee;
        border: 2px solid #fcc;
        border-radius: 8px;
        padding: 16px;
        color: #c33;
        font-family: monospace;
        font-size: 12px;
        z-index: 999999;
        max-height: 200px;
        overflow: auto;
      \`;
      errorDiv.innerHTML = \`
        <strong>⚠️ Error:</strong><br>
        \${event.error?.message || event.message || 'Unknown error'}
        <br><br>
        <small style="color: #666;">\${event.error?.stack || ''}</small>
      \`;
      
      document.body.insertBefore(errorDiv, document.body.firstChild);
      
      // Prevent default error handling
      event.preventDefault();
    });
    
    // Prevent accidental navigation
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function(e) {
          if (!link.href || link.href === '#') {
            e.preventDefault();
          }
        });
      });
    });
  </script>
</head>
<body>
  ${bodyContent}
  
  ${javascript ? `<script>\n${javascript}\n</script>` : ''}
</body>
</html>`;
}
