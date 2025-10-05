import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Code, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  useEffect(() => {
    setCode(generatedCode);
  }, [generatedCode]);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
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
            <div className="h-full border rounded-lg overflow-hidden bg-white">
              <iframe
                ref={iframeRef}
                className="w-full h-full"
                title="Template Preview"
                sandbox="allow-scripts"
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 mt-4 overflow-hidden">
            <div className="h-full border rounded-lg overflow-hidden">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-slate-950 text-slate-50 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
