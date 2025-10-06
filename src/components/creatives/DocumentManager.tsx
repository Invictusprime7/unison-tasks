import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Image, Video, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { DocumentType } from "@/types/document";

export const DocumentManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<DocumentType>("design");

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          title: newDocTitle,
          type: newDocType,
          user_id: user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Initialize based on type
      if (newDocType === "design") {
        const { error: pageError } = await supabase.from("pages").insert({
          document_id: doc.id,
          width: 1920,
          height: 1080,
          sort_order: 0,
        });
        if (pageError) throw pageError;
      } else {
        const { data: timeline, error: timelineError } = await supabase
          .from("timelines")
          .insert({
            document_id: doc.id,
            fps: 30,
            duration: 10,
          })
          .select()
          .single();

        if (timelineError) throw timelineError;

        await supabase.from("tracks").insert([
          { timeline_id: timeline.id, type: "video", sort_order: 0 },
          { timeline_id: timeline.id, type: "audio", sort_order: 1 },
        ]);
      }

      // Close dialog and navigate to the studio
      setDialogOpen(false);
      setNewDocTitle("");
      toast({ 
        title: "Success", 
        description: `${newDocType === "design" ? "Design" : "Video"} project created!` 
      });
      
      // Navigate to the document in the studio
      navigate(`/design-studio/${doc.id}`);
    } catch (error: any) {
      const msg = error?.message || "Something went wrong";
      if (msg.toLowerCase().includes("not authenticated")) {
        toast({ title: "Please sign in", description: "Log in to create a document." });
        navigate("/auth");
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("documents").delete().eq("id", docId);
      if (error) throw error;
      toast({ title: "Success", description: "Document deleted" });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Documents</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="My awesome project"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup value={newDocType} onValueChange={(v) => setNewDocType(v as DocumentType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="design" id="design" />
                    <Label htmlFor="design" className="flex items-center gap-2 cursor-pointer">
                      <Image className="h-4 w-4" />
                      Design (Graphics/Images)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                      <Video className="h-4 w-4" />
                      Video (Timeline/Animation)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button onClick={handleCreateDocument} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : documents && documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(`/design-studio/${doc.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {doc.type === "design" ? <Image className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    {doc.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="capitalize">{doc.type} Document</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No documents yet. Create your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
