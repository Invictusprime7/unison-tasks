import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HTMLComponentPreviewProps {
  html: string;
  css: string;
  className?: string;
}

export const HTMLComponentPreview: React.FC<HTMLComponentPreviewProps> = ({
  html,
  css,
  className,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #ffffff;
          }
          ${css}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    doc.open();
    doc.write(fullHTML);
    doc.close();
  }, [html, css]);

  return (
    <iframe
      ref={iframeRef}
      className={cn('w-full h-full border-0', className)}
      title="Component Preview"
      sandbox="allow-scripts"
    />
  );
};
