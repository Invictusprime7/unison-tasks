import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Image, Folder, Palette, Search } from "lucide-react";
import { BrandKitPanel } from "../BrandKitPanel";
import type { BrandKit } from "@/types/document";

interface AssetDockProps {
  brandKit?: BrandKit;
  onBrandKitChange?: (brandKit: BrandKit) => void;
  onImageSelect?: (imageUrl: string) => void;
  onUpload?: (file: File) => void;
}

export const AssetDock = ({
  brandKit,
  onBrandKitChange,
  onImageSelect,
  onUpload
}: AssetDockProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <Card className="w-80 h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Assets</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="uploads" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="uploads" className="flex-1">
            <Folder className="h-4 w-4 mr-2" />
            Uploads
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex-1">
            <Image className="h-4 w-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex-1">
            <Palette className="h-4 w-4 mr-2" />
            Brand Kit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="flex-1 m-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('asset-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Asset
              </Button>
              <input
                id="asset-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="grid grid-cols-2 gap-2">
                {/* Uploaded assets will be displayed here */}
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  No uploads yet
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stock" className="flex-1 m-0">
          <ScrollArea className="h-full p-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Stock images will be displayed here */}
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                Stock library coming soon
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="brand" className="flex-1 m-0">
          <ScrollArea className="h-full">
            {brandKit && onBrandKitChange ? (
              <BrandKitPanel
                brandKit={brandKit}
                onBrandKitChange={onBrandKitChange}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No brand kit available
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
