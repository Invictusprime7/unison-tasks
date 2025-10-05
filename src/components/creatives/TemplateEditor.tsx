import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Code, Eye, Copy, RefreshCw } from "lucide-react";
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
}

export const TemplateEditor = ({
  open,
  onOpenChange,
  templateName,
  aesthetic,
  generatedCode,
  onBack,
}: TemplateEditorProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [code, setCode] = useState(generatedCode);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setCode(generatedCode);
  }, [generatedCode]);

  useEffect(() => {
    if (iframeRef.current && code) {
      const iframe = iframeRef.current;
      
      // Wait for iframe to be ready
      const updateIframe = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(code);
          iframeDoc.close();
        }
      };

      // If iframe is already loaded, update immediately
      if (iframe.contentDocument?.readyState === 'complete') {
        updateIframe();
      } else {
        // Otherwise wait for load
        iframe.onload = updateIframe;
      }
    }
  }, [code]);

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
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
      }
    }
    toast.success("Preview refreshed!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-2xl">{templateName}</DialogTitle>
                <p className="text-sm text-muted-foreground">{aesthetic}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefreshPreview}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              Code
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="flex-1 mt-4 overflow-hidden">
            <div className="h-full border rounded-lg overflow-hidden bg-white shadow-lg">
              <iframe
                ref={iframeRef}
                className="w-full h-full"
                title="Template Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{ border: 'none' }}
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 mt-4 overflow-hidden">
            <div className="h-full border rounded-lg overflow-hidden bg-[#1e1e1e] relative">
              {!isEditing ? (
                <>
                  <div className="absolute top-2 right-2 z-10">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Code className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    language="html"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      height: '100%',
                      fontSize: '13px',
                      lineHeight: '1.5',
                    }}
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
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-[#1e1e1e] text-slate-50 resize-none focus:outline-none"
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
