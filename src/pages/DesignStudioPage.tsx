import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DesignStudio } from "@/components/creatives/DesignStudio";
import { FileBrowser } from "@/components/creatives/design-studio/FileBrowser";

const DesignStudioPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const designStudioRef = useRef<any>(null);

  // Load template from navigation state if available
  useEffect(() => {
    const state = location.state as { templateCode?: string; templateName?: string; aesthetic?: string };
    if (state?.templateCode && designStudioRef.current) {
      // Load the HTML template into the design studio
      designStudioRef.current?.loadHTMLTemplate?.(state.templateCode);
    }
  }, [location.state]);

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

      <div className="flex-1 overflow-hidden">
        <DesignStudio ref={designStudioRef} />
      </div>

      <FileBrowser 
        open={fileBrowserOpen} 
        onOpenChange={setFileBrowserOpen}
        onImageSelect={(imageUrl) => designStudioRef.current?.addImageFromUrl(imageUrl)}
      />
    </div>
  );
};

export default DesignStudioPage;
