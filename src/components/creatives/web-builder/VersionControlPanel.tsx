import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock, Save, RotateCcw, Eye, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Version {
  id: string;
  name: string;
  timestamp: Date;
  author: string;
  changes: string;
  snapshot: any;
}

interface VersionControlPanelProps {
  onRestore: (version: Version) => void;
  onSave: (name: string, changes: string) => void;
}

export const VersionControlPanel = ({ onRestore, onSave }: VersionControlPanelProps) => {
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "v1",
      name: "Initial Design",
      timestamp: new Date(Date.now() - 86400000),
      author: "You",
      changes: "Created hero section and navbar",
      snapshot: {},
    },
    {
      id: "v2",
      name: "Added Features",
      timestamp: new Date(Date.now() - 43200000),
      author: "You",
      changes: "Added feature grid and CTA section",
      snapshot: {},
    },
  ]);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionChanges, setNewVersionChanges] = useState("");

  const saveNewVersion = () => {
    if (!newVersionName.trim()) {
      toast.error("Please enter a version name");
      return;
    }

    const newVersion: Version = {
      id: `v${versions.length + 1}`,
      name: newVersionName,
      timestamp: new Date(),
      author: "You",
      changes: newVersionChanges || "No changes specified",
      snapshot: {},
    };

    setVersions([newVersion, ...versions]);
    onSave(newVersionName, newVersionChanges);
    toast.success("Version saved successfully");
    setShowSaveDialog(false);
    setNewVersionName("");
    setNewVersionChanges("");
  };

  const restoreVersion = (version: Version) => {
    onRestore(version);
    toast.success(`Restored to "${version.name}"`);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Version History
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Track and restore previous versions
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Save New Version */}
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save New Version</DialogTitle>
                <DialogDescription>
                  Create a snapshot of your current design
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Version Name</Label>
                  <Input
                    placeholder="e.g., Added footer section"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Changes (optional)</Label>
                  <Input
                    placeholder="Describe what changed..."
                    value={newVersionChanges}
                    onChange={(e) => setNewVersionChanges(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveNewVersion} className="flex-1">
                    Save Version
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Separator />

          {/* Version Timeline */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Timeline ({versions.length} versions)
            </Label>
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-border rounded-lg p-3 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{version.name}</h4>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.timestamp)}
                        <span>•</span>
                        <span>{version.author}</span>
                      </div>
                    </div>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Changes */}
                  <p className="text-xs text-muted-foreground">
                    {version.changes}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => restoreVersion(version)}
                      disabled={index === 0}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Auto-save Settings */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Settings
            </Label>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Auto-save</span>
                <Badge variant="secondary">Every 5 min</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Max versions</span>
                <Badge variant="secondary">50</Badge>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
