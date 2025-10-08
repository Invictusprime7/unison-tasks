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
    <div className="h-screen w-full flex flex-col bg-card overflow-hidden">
      <header className="h-10 sm:h-12 border-b bg-background flex items-center justify-between px-2 sm:px-4 shrink-0 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/creatives")}
            className="h-7 sm:h-8 px-2"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm sm:text-lg font-semibold truncate">Design Studio</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFileBrowserOpen(true)}
          className="h-7 sm:h-8 px-2 flex-shrink-0"
        >
          <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Browse Files</span>
        </Button>
      </header>

      <Tabs value={activeEditor} onValueChange={(v) => setActiveEditor(v as "fabric" | "grapejs")} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="mx-2 sm:mx-4 mt-1 sm:mt-2 w-fit h-8 flex-shrink-0">
          <TabsTrigger value="fabric" className="text-xs sm:text-sm h-7 px-2 sm:px-3">Canvas</TabsTrigger>
          <TabsTrigger value="grapejs" className="text-xs sm:text-sm h-7 px-2 sm:px-3">Web</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fabric" className="flex-1 mt-0 overflow-hidden">
          <DesignStudio ref={designStudioRef} />
        </TabsContent>
        
        <TabsContent value="grapejs" className="flex-1 mt-0 overflow-hidden">
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
