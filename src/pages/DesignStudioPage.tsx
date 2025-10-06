import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FolderOpen, Image, Video } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DesignStudio } from "@/components/creatives/DesignStudio";
import { FileBrowser } from "@/components/creatives/design-studio/FileBrowser";
import { Timeline } from "@/components/creatives/timeline/Timeline";
import { useDocument } from "@/hooks/useDocument";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DesignStudioPage = () => {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const { toast } = useToast();
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const { document, loading, updateDocument, reloadDocument } = useDocument(documentId || null);

  const handleTimelineChange = async (timeline: any) => {
    if (!document || !timeline) return;
    try {
      await supabase.from("timelines").update({
        fps: timeline.fps,
        duration: timeline.duration,
      }).eq("id", timeline.id);
      reloadDocument();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Document not found</p>
        <Button onClick={() => navigate("/creatives")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creatives
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/creatives")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{document.title}</h1>
            <Badge variant="outline" className="gap-1">
              {document.type === "design" ? <Image className="h-3 w-3" /> : <Video className="h-3 w-3" />}
              {document.type === "design" ? "Design" : "Video"}
            </Badge>
          </div>
        </div>
        {document.type === "design" && (
          <Button variant="outline" size="sm" onClick={() => setFileBrowserOpen(true)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {document.type === "design" ? (
          <DesignStudio />
        ) : (
          document.timeline && (
            <Timeline
              timeline={document.timeline}
              onTimelineChange={handleTimelineChange}
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
            />
          )
        )}
      </div>

      <FileBrowser open={fileBrowserOpen} onOpenChange={setFileBrowserOpen} onImageSelect={() => {}} />
    </div>
  );
};

export default DesignStudioPage;
