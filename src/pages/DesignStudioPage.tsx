import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DesignStudio } from "@/components/creatives/DesignStudio";
import { FileBrowser } from "@/components/creatives/design-studio/FileBrowser";
import { GrapeJSEditor } from "@/components/creatives/GrapeJSEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DesignStudioPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const designStudioRef = useRef<any>(null);
  const [templateHtml, setTemplateHtml] = useState("");
  const [templateCss, setTemplateCss] = useState("");
  const [activeEditor, setActiveEditor] = useState<"fabric" | "grapejs">("fabric");

  // Load template from navigation state if available
  useEffect(() => {
    const state = location.state as { templateCode?: string; templateName?: string; aesthetic?: string };
    if (state?.templateCode) {
      setTemplateHtml(state.templateCode);
      setActiveEditor("grapejs");
    }
  }, [location.state]);

  const handleTemplateSave = (html: string, css: string) => {
    setTemplateHtml(html);
    setTemplateCss(css);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/creatives")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Design Studio</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFileBrowserOpen(true)}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Browse Files
        </Button>
      </header>

      <Tabs value={activeEditor} onValueChange={(v) => setActiveEditor(v as "fabric" | "grapejs")} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="fabric">Canvas Editor</TabsTrigger>
          <TabsTrigger value="grapejs">Web Builder</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fabric" className="flex-1 mt-0">
          <DesignStudio ref={designStudioRef} />
        </TabsContent>
        
        <TabsContent value="grapejs" className="flex-1 mt-0">
          <GrapeJSEditor 
            initialHtml={templateHtml}
            initialCss={templateCss}
            onSave={handleTemplateSave}
          />
        </TabsContent>
      </Tabs>

      <FileBrowser 
        open={fileBrowserOpen} 
        onOpenChange={setFileBrowserOpen}
        onImageSelect={(imageUrl) => designStudioRef.current?.addImageFromUrl(imageUrl)}
      />
    </div>
  );
};

export default DesignStudioPage;
