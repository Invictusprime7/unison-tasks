import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Play, Code2, Eye, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LiveCodePreview } from './LiveCodePreview';
import { HTMLComponentPreview } from './HTMLComponentPreview';
import { parseComponentCode } from '@/utils/componentRenderer';

interface CodeViewerProps {
  code: string;
  language?: string;
  onRender?: (code: string) => Promise<void>;
  className?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code: initialCode,
  language = 'typescript',
  onRender,
  className,
}) => {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'live' | 'component'>('code');
  const { toast } = useToast();

  // Parse component for preview
  const [componentData, setComponentData] = useState(() => parseComponentCode(initialCode));

  // Update code when initialCode changes
  React.useEffect(() => {
    setCode(initialCode);
    setComponentData(parseComponentCode(initialCode));
    console.log('[CodeViewer] Code updated:', initialCode.substring(0, 100));
  }, [initialCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied to clipboard',
      description: 'Code copied successfully',
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `component.${language === 'typescript' ? 'tsx' : language}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Downloaded',
      description: 'Code file downloaded successfully',
    });
  };

  const handleRender = async () => {
    console.log('[CodeViewer] Rendering code to canvas:', code.substring(0, 100));
    if (!onRender) {
      console.warn('[CodeViewer] No onRender callback provided');
      toast({
        title: 'Cannot render',
        description: 'Canvas connection not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onRender(code);
      toast({
        title: 'Rendered successfully!',
        description: 'Your code is now on the canvas',
      });
    } catch (error) {
      console.error('[CodeViewer] Render error:', error);
      toast({
        title: 'Render failed',
        description: error instanceof Error ? error.message : 'Failed to execute code',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-background border rounded-lg overflow-hidden', className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Code Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-2"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          {onRender && (
            <Button
              variant="default"
              size="sm"
              onClick={handleRender}
              className="h-8 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Render to Canvas
            </Button>
          )}
        </div>
      </div>

      {/* Editor with tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 rounded-none h-10 border-b">
          <TabsTrigger value="code" className="gap-2">
            <Code2 className="w-4 h-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="component" className="gap-2">
            <Eye className="w-4 h-4" />
            Component
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Monitor className="w-4 h-4" />
            Live Preview
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Play className="w-4 h-4" />
            Canvas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="flex-1 m-0 p-0 data-[state=active]:flex">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={(value) => {
              const newCode = value || '';
              setCode(newCode);
              setComponentData(parseComponentCode(newCode));
            }}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 16, bottom: 16 },
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading editor...</p>
                </div>
              </div>
            }
          />
        </TabsContent>


        <TabsContent value="component" className="flex-1 m-0 p-0 data-[state=active]:flex bg-muted/10">
          <HTMLComponentPreview 
            html={componentData.html}
            css={componentData.css}
            className="w-full h-full"
          />
        </TabsContent>

        <TabsContent value="live" className="flex-1 m-0 p-0 data-[state=active]:flex">
          <LiveCodePreview code={code} autoRefresh={true} />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 p-4 overflow-auto bg-muted/10">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Canvas Preview</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Click "Render to Canvas" to see your component on the Fabric.js canvas
                </p>
                {onRender && (
                  <Button
                    onClick={handleRender}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Render Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
