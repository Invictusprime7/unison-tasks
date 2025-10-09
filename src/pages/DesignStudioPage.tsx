import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DesignStudio } from "@/components/creatives/DesignStudio";
import { FileBrowser } from "@/components/creatives/design-studio/FileBrowser";
import { VisualEditor } from "@/components/creatives/VisualEditor";

const DesignStudioPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const designStudioRef = useRef<any>(null);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      <header className="h-10 sm:h-12 border-b border-gray-200 bg-white flex items-center justify-between px-2 sm:px-4 shrink-0 min-w-0">
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
