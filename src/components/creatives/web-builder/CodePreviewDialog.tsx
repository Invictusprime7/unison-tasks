import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fabricCanvas: any;
}

export const CodePreviewDialog = ({
  isOpen,
  onClose,
  fabricCanvas,
}: CodePreviewDialogProps) => {
  const [copied, setCopied] = useState(false);

  const generateHTML = () => {
    if (!fabricCanvas) return "<div>No content</div>";

    const objects = fabricCanvas.getObjects();
    let html = '<div class="web-builder-output">\n';

    objects.forEach((obj: any) => {
      if (obj.webBlockData?.html) {
        html += `  ${obj.webBlockData.html}\n`;
      } else if (obj.type === "rect") {
        html += `  <div style="width: ${obj.width}px; height: ${obj.height}px; background: ${obj.fill};"></div>\n`;
      } else if (obj.type === "textbox" || obj.type === "i-text") {
        html += `  <p style="font-size: ${obj.fontSize}px; color: ${obj.fill};">${obj.text}</p>\n`;
      }
    });

    html += "</div>";
    return html;
  };

  const generateCSS = () => {
    return `.web-builder-output {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

/* Add your custom styles here */`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const htmlCode = generateHTML();
  const cssCode = generateCSS();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Code Preview</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="html" className="w-full">
          <TabsList className="bg-white/5">
            <TabsTrigger value="html" className="data-[state=active]:bg-white/10">
              HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="data-[state=active]:bg-white/10">
              CSS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(htmlCode)}
                className="text-white/70 hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="bg-[#0a0a0a] p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
              <code className="text-white/80">{htmlCode}</code>
            </pre>
          </TabsContent>

          <TabsContent value="css" className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(cssCode)}
                className="text-white/70 hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="bg-[#0a0a0a] p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
              <code className="text-white/80">{cssCode}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
