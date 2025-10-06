import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DesignStudio } from "@/components/creatives/DesignStudio";
import { FileBrowser } from "@/components/creatives/design-studio/FileBrowser";

const DesignStudioPage = () => {
  const navigate = useNavigate();
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const designStudioRef = useRef<any>(null);

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
