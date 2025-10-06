import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Folder, Image as ImageIcon, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FileBrowser = ({ open, onOpenChange }: FileBrowserProps) => {
  const [currentFolder, setCurrentFolder] = useState("/generated-images");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: files, isLoading } = useQuery({
    queryKey: ["design-files", currentFolder, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("files")
        .select("*")
        .eq("folder_path", currentFolder)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleDragStart = async (e: React.DragEvent, file: any) => {
    if (file.mime_type !== "folder") {
      const { data } = await supabase.storage
        .from("user-files")
        .createSignedUrl(file.storage_path, 3600);

      if (data?.signedUrl) {
        e.dataTransfer.setData("text/uri-list", data.signedUrl);
        e.dataTransfer.effectAllowed = "copy";
      }
    }
  };

  const handleFolderClick = (folderName: string) => {
    const newPath = currentFolder === "/" 
      ? `/${folderName}` 
      : `${currentFolder}/${folderName}`;
    setCurrentFolder(newPath);
  };

  const handleBackClick = () => {
    const parts = currentFolder.split("/").filter(Boolean);
    parts.pop();
    setCurrentFolder(parts.length ? `/${parts.join("/")}` : "/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>File Browser</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {currentFolder !== "/" && (
              <Button variant="outline" size="sm" onClick={handleBackClick}>
                Back
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Current: {currentFolder}
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : files && files.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 p-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    draggable={file.mime_type !== "folder"}
                    onDragStart={(e) => handleDragStart(e, file)}
                    onClick={() => file.mime_type === "folder" && handleFolderClick(file.name)}
                    className="group relative aspect-square rounded-lg border bg-card hover:bg-accent hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                      {file.mime_type === "folder" ? (
                        <Folder className="h-12 w-12 text-primary mb-2" />
                      ) : file.mime_type?.startsWith("image/") ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-primary" />
                        </div>
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs text-center truncate w-full px-1">
                        {file.name}
                      </p>
                      {file.mime_type !== "folder" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Drag to canvas
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No files found
              </div>
            )}
          </ScrollArea>

          <div className="text-xs text-muted-foreground border-t pt-2">
            💡 Tip: Drag images directly onto the canvas to add them
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
