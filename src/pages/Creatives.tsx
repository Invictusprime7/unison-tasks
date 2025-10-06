import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Sparkles, Image, FileText, Video, Cloud, Home, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ImageEditor } from "@/components/creatives/ImageEditor";
import { VideoEditor } from "@/components/creatives/VideoEditor";
import { CreativeTaskSelector } from "@/components/creatives/CreativeTaskSelector";
import { DocumentManager } from "@/components/creatives/DocumentManager";

const Creatives = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to access Creatives",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate, toast]);

  const { data: creativeTasks, isLoading } = useQuery({
    queryKey: ["creative-tasks", searchQuery],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("tasks")
        .select(`
          *,
          projects(name, id)
        `)
        .in("status", ["todo", "in_progress"])
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const categorizedTasks = {
    design: creativeTasks?.filter(t => 
      t.title.toLowerCase().includes("design") || 
      t.description?.toLowerCase().includes("design")
    ) || [],
    content: creativeTasks?.filter(t => 
      t.title.toLowerCase().includes("content") || 
      t.title.toLowerCase().includes("write") ||
      t.description?.toLowerCase().includes("content")
    ) || [],
    media: creativeTasks?.filter(t => 
      t.title.toLowerCase().includes("video") || 
      t.title.toLowerCase().includes("image") ||
      t.description?.toLowerCase().includes("media")
    ) || [],
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                Creative Tasks
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your creative projects and ideas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button onClick={() => setSelectorOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Creative Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Document Manager */}
        <DocumentManager />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creative tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="design">
              <Image className="h-4 w-4 mr-2" />
              Design
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="media">
              <Video className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : creativeTasks && creativeTasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creativeTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/project/${task.project_id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {task.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {task.projects?.name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          task.status === "todo" 
                            ? "bg-muted text-muted-foreground" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {task.status === "todo" ? "To Do" : "In Progress"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No creative tasks found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="design" className="space-y-4 mt-6">
            {categorizedTasks.design.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedTasks.design.map((task) => (
                  <Card 
                    key={task.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/project/${task.project_id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {task.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-muted-foreground">
                        {task.projects?.name}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No design tasks found
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-6">
            {categorizedTasks.content.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedTasks.content.map((task) => (
                  <Card 
                    key={task.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/project/${task.project_id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {task.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-muted-foreground">
                        {task.projects?.name}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No content tasks found
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4 mt-6">
            {categorizedTasks.media.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedTasks.media.map((task) => (
                  <Card 
                    key={task.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/project/${task.project_id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {task.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-muted-foreground">
                        {task.projects?.name}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No media tasks found
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreativeTaskSelector open={selectorOpen} onOpenChange={setSelectorOpen} />
    </div>
  );
};

export default Creatives;
