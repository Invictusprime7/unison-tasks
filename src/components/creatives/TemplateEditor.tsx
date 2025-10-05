import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Eye, Code, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
  const [code, setCode] = useState(generatedCode);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, "-")}.tsx`;
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
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "code" | "preview")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              Code Editor
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex-1 overflow-hidden mt-4">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full font-mono text-sm resize-none"
              placeholder="Generated code will appear here..."
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="bg-background border rounded-lg p-8 min-h-full">
              <div className="mb-4 p-4 bg-muted rounded border">
                <p className="text-sm text-muted-foreground">
                  <strong>Preview Note:</strong> The generated React component code can be
                  copied and used directly in your project. Full interactive preview coming soon.
                </p>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded border">
                {code}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
