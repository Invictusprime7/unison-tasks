import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Loader2, Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleCanvasBuilderProps {
  template: {
    name: string;
    code: string;
    aesthetic: string;
  };
  onBack: () => void;
}

export const SimpleCanvasBuilder: React.FC<SimpleCanvasBuilderProps> = ({
  template,
  onBack
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !template.code) {
      console.warn('SimpleCanvasBuilder: No iframe or template code', { 
        hasIframe: !!iframe, 
        hasCode: !!template.code,
        codeLength: template.code?.length || 0
      });
      return;
    }

    console.log('SimpleCanvasBuilder: Loading template', { 
      name: template.name, 
      aesthetic: template.aesthetic,
      codeLength: template.code.length,
      codePreview: template.code.substring(0, 200) + '...'
    });

    // Clean up previous URL if exists
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }

    setIsLoading(true);

    // Create optimized blob URL with validation
    let htmlContent = template.code;
    
    // Check if template code is empty or too short
    if (!htmlContent || htmlContent.trim().length < 50) {
      console.warn('Template code is empty or too short, using fallback');
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body { 
            margin: 0; 
            padding: 40px; 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .aesthetic { 
            background: #f8f9fa; 
            padding: 10px 20px; 
            border-radius: 6px; 
            margin: 20px 0;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${template.name}</h1>
        <div class="aesthetic">Aesthetic: ${template.aesthetic}</div>
        <p>This is a template preview. The original generated code was empty or invalid.</p>
        <p>This fallback layout demonstrates the template structure and styling capabilities.</p>
    </div>
</body>
</html>`;
    } else if (!htmlContent.includes('<!DOCTYPE') && !htmlContent.includes('<html')) {
      console.warn('Template missing HTML structure, wrapping in basic HTML');
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    currentUrlRef.current = url;

    // Set up timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      console.warn('Iframe loading timeout - assuming loaded');
    }, 5000); // 5 second timeout - reduced for better UX

    const handleLoad = () => {
      setIsLoading(false);
      clearTimeout(timeoutId);
      console.log('SimpleCanvasBuilder: Template loaded successfully');
    };

    const handleError = () => {
      setIsLoading(false);
      clearTimeout(timeoutId);
      console.error('SimpleCanvasBuilder: Failed to load template');
      toast.error('Failed to load template preview');
    };

    // Add event listeners
    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Set iframe source
    iframe.src = url;

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [template.code]);
  const exportTemplate = () => {
    // Create a blob from the template code
    const blob = new Blob([template.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
    toast.success('Template exported successfully!');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'}`}>
      {/* Left Sidebar - Hide in fullscreen mode on small screens */}
      <div className={`bg-white border-r border-gray-200 overflow-y-auto ${
        isFullscreen ? 'hidden lg:block lg:w-80' : 'w-80'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Template
          </Button>
          <h2 className="text-lg font-semibold">Canvas Builder</h2>
          <p className="text-sm text-gray-500">Edit {template.name}</p>
        </div>

        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Template Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Name:</strong> {template.name}
                </div>
                <div>
                  <strong>Style:</strong> {template.aesthetic}
                </div>
                <Button onClick={exportTemplate} className="w-full mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={toggleFullscreen} variant="outline" className="w-full">
                  {isFullscreen ? (
                    <>
                      <Minimize className="h-4 w-4 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 mr-2" />
                      Fullscreen Preview
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Advanced canvas editing tools for typography, UI elements, and layering coming soon!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{template.name}</h1>
              <span className="text-sm text-gray-500">- Canvas Builder</span>
            </div>
            <div className="flex items-center gap-2">
              {isFullscreen && (
                <Button variant="ghost" onClick={onBack} className="lg:hidden">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={exportTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="mx-auto bg-white shadow-lg max-w-6xl">
            <div className="border border-gray-200 rounded-lg overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-600">Loading template...</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full h-[800px] border-0"
                title={`${template.name} Preview`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};