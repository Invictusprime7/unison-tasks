import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export const CreateProjectDialog = ({ open, onOpenChange, userId }: CreateProjectDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Check if user is authenticated
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // First, try to create the project directly
    const { error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        owner_id: userId,
      });

    // If the project creation fails due to profile issues, try to fix it
    if (projectError) {
      console.error('Project creation error:', projectError);
      
      // If it's a foreign key constraint error (profile doesn't exist), create the profile
      if (projectError.message.includes('violates foreign key constraint') || 
          projectError.message.includes('violates row-level security policy')) {
        
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          // Create the profile using a direct insert with error handling
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.user.id,
              full_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'User',
              avatar_url: user.user.user_metadata?.avatar_url || null,
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // If profile creation fails, try upsert
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: user.user.id,
                full_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'User',
                avatar_url: user.user.user_metadata?.avatar_url || null,
              }, {
                onConflict: 'id'
              });

            if (upsertError) {
              console.error('Profile upsert error:', upsertError);
            }
          }

          // Now try creating the project again
          const { error: retryError } = await supabase
            .from('projects')
            .insert({
              name,
              description,
              owner_id: userId,
            });

          setLoading(false);

          if (retryError) {
            toast({
              title: "Error",
              description: `Failed to create project: ${retryError.message}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: "Project created successfully!",
            });
            onOpenChange(false);
            (e.target as HTMLFormElement).reset();
          }
        } else {
          setLoading(false);
          toast({
            title: "Error",
            description: "Authentication error. Please refresh and try again.",
            variant: "destructive",
          });
        }
      } else {
        setLoading(false);
        toast({
          title: "Error",
          description: projectError.message,
          variant: "destructive",
        });
      }
    } else {
      // Project created successfully
      setLoading(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      onOpenChange(false);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your team's tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Marketing Campaign"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your project..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};