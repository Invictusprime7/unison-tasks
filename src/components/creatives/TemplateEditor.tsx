import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Code, Eye, Copy, RefreshCw, Wrench, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  aesthetic: string;
  generatedCode: string;
  onBack: () => void;
  onBuild?: () => void;
}

export const TemplateEditor = ({
  open,
  onOpenChange,
  templateName,
  aesthetic,
  generatedCode,
  onBack,
  onBuild,
}: TemplateEditorProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [code, setCode] = useState(generatedCode);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCleanPreview, setShowCleanPreview] = useState(false);
  const currentUrlRef = useRef<string | null>(null);
  const lastCodeRef = useRef<string>('');

  // Update code when generatedCode changes, but avoid unnecessary updates
  useEffect(() => {
    if (generatedCode && generatedCode !== lastCodeRef.current) {
      setCode(generatedCode);
      lastCodeRef.current = generatedCode;
    }
  }, [generatedCode]);

  // Auto-load preview when dialog opens
  useEffect(() => {
    if (open && code) {
      // Small delay to ensure iframe is mounted
      const timer = setTimeout(() => {
        const iframe = iframeRef.current;
        if (iframe) {
          loadPreview();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, code]);

  const loadPreview = () => {
    const iframe = iframeRef.current;
    if (!iframe || !code) return;

    // Skip loading if document is hidden (tab not active)
    if (document.hidden) {
      return;
    }

    // Clean up previous URL if exists
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }

    setIsLoading(true);

    // Create clean HTML for preview (remove visible HTML tags if requested)
    let previewCode = code;
    if (showCleanPreview) {
      previewCode = createCleanPreview(code);
    }

    // Create new blob URL
    const blob = new Blob([previewCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    currentUrlRef.current = url;

    // Set up timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      console.warn('Iframe loading timeout - assuming loaded');
    }, 3000); // Reduced to 3 seconds for faster UX

    // Event handlers
    const handleLoad = () => {
      // Use requestAnimationFrame for smoother UI updates
      requestAnimationFrame(() => {
        setIsLoading(false);
        clearTimeout(timeoutId);
      });
    };

    const handleError = () => {
      requestAnimationFrame(() => {
        setIsLoading(false);
        clearTimeout(timeoutId);
        console.error('Failed to load iframe content');
      });
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
  };

  // Create clean preview without visible HTML tags
  const createCleanPreview = (htmlCode: string) => {
    // Extract content from HTML and present it cleanly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlCode;
    
    // Get all text content
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Create a clean HTML structure
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateName} - Clean Preview</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background: #f9f9f9;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .title {
            color: #2563eb;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .aesthetic {
            color: #6b7280;
            font-style: italic;
        }
        .text-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="content">
        <div class="header">
            <div class="title">${templateName}</div>
            <div class="aesthetic">Style: ${aesthetic}</div>
        </div>
        <div class="text-content">${textContent || 'No text content found in template'}</div>
    </div>
</body>
</html>`;
  };

  // Handle iframe content loading - trigger auto-load when code changes
  useEffect(() => {
    if (code) {
      return loadPreview();
    }
  }, [code, showCleanPreview]); // Added showCleanPreview to dependencies

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleRefreshPreview = () => {
    if (!code) return;
    
    setIsLoading(true);
    toast.success("Refreshing preview...");
    
    // Use the same loadPreview function for consistency
    setTimeout(() => {
      loadPreview();
    }, 100);
  };

  const handleExpandPreview = () => {
    // Instead of expanding within the dialog, open the template in a new window
    if (code) {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window with appropriate size
      const newWindow = window.open(
        url, 
        '_blank',
        'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );
      
      if (newWindow) {
        // Clean up the blob URL after a delay to allow the window to load
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 5000);
        
        toast.success("Template opened in new window!");
      } else {
        toast.error("Please allow popups to view the expanded preview");
      }
    }
    
    // If onBuild is provided, still trigger it for backward compatibility
    if (onBuild) {
      onBuild();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-[95vw] max-h-[100vh] sm:max-h-[95vh] h-[100vh] sm:h-[95vh] overflow-hidden flex flex-col p-2 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-lg sm:text-2xl">{templateName}</DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{aesthetic}</p>
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCopyCode} className="text-xs sm:text-sm h-8 sm:h-9">
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy Code</span>
              </Button>
              {/* Manual refresh - only needed if auto-loading fails */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefreshPreview} 
                disabled={isLoading} 
                className="text-xs sm:text-sm h-8 sm:h-9 opacity-60 hover:opacity-100"
                title="Manual refresh (auto-loading should work automatically)"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
              </Button>
              {isLoading && (
                <Button variant="ghost" size="sm" onClick={() => setIsLoading(false)} className="text-xs sm:text-sm h-8 sm:h-9">
                  Stop Loading
                </Button>
              )}
              <Button 
                variant={showCleanPreview ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowCleanPreview(!showCleanPreview)} 
                className="text-xs sm:text-sm h-8 sm:h-9"
                title={showCleanPreview ? "Show full HTML preview" : "Show clean preview without HTML tags"}
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showCleanPreview ? 'HTML' : 'Clean'}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExpandPreview} 
                className="text-xs sm:text-sm h-8 sm:h-9"
                title="Open template in new window for full-screen preview"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Open</span>
              </Button>
              {onBuild && (
                <Button variant="default" size="sm" onClick={onBuild} className="text-xs sm:text-sm h-8 sm:h-9">
                  <Wrench className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Build</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs sm:text-sm h-8 sm:h-9">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 w-full sm:w-auto">
            <TabsTrigger value="preview" className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              <Code className="h-3 w-3 sm:h-4 sm:w-4" />
              Code
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="flex-1 mt-2 sm:mt-4 overflow-hidden">
            <div className="h-full border rounded-lg overflow-hidden bg-white shadow-lg relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-600">Loading preview...</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full h-full"
                title="Template Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{ border: 'none', minHeight: '300px' }}
                // Add additional attributes for better loading behavior
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 mt-2 sm:mt-4 overflow-hidden">
            <div className="h-full border rounded-lg overflow-hidden bg-[#1e1e1e] relative">
              {!isEditing ? (
                <>
                  <div className="absolute top-2 right-2 z-10">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => setIsEditing(true)}
                      className="text-xs h-7 sm:h-8"
                    >
                      <Code className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    language="html"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      height: '100%',
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                    className="sm:text-sm"
                    showLineNumbers
                    wrapLines
                  >
                    {code}
                  </SyntaxHighlighter>
                </>
              ) : (
                <>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                      className="text-xs h-7 sm:h-8"
                    >
                      <Eye className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full p-2 sm:p-4 font-mono text-xs sm:text-sm bg-[#1e1e1e] text-slate-50 resize-none focus:outline-none"
                    spellCheck={false}
                  />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
