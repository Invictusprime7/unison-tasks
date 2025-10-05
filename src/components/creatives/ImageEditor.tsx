import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Image, Wand2, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ImageEditor = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt },
      });

      if (error) throw error;
      
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image generated!",
        description: "Your AI-generated image is ready",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "generated-image.png";
    link.click();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          AI Image Editor
        </CardTitle>
        <CardDescription>
          Generate and edit images with AI-powered tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload Image</label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {uploadedImage && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-48 object-contain rounded"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">AI Image Generation</label>
          <Textarea
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Image"}
          </Button>
        </div>

        {generatedImage && (
          <div className="space-y-2">
            <div className="rounded-lg border bg-muted/50 p-4">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-64 object-contain rounded"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => handleDownload(generatedImage)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
