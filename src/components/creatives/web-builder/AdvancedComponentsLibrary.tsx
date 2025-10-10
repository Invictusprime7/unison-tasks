import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  LayoutTemplate,
  Type,
  Image,
  Video,
  Table,
  List,
  Grid3x3,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  CreditCard,
  User,
  Menu,
  Search,
  Star,
} from "lucide-react";

interface ComponentTemplate {
  id: string;
  name: string;
  category: "layout" | "content" | "form" | "ecommerce" | "navigation";
  icon: any;
  tags: string[];
  premium?: boolean;
}

interface AdvancedComponentsLibraryProps {
  onAddComponent: (componentId: string) => void;
}

export const AdvancedComponentsLibrary = ({ onAddComponent }: AdvancedComponentsLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const components: ComponentTemplate[] = [
    // Layout Components
    { id: "hero-split", name: "Hero Split", category: "layout", icon: LayoutTemplate, tags: ["hero", "landing"] },
    { id: "hero-centered", name: "Hero Centered", category: "layout", icon: LayoutTemplate, tags: ["hero", "cta"] },
    { id: "feature-grid", name: "Feature Grid", category: "layout", icon: Grid3x3, tags: ["features", "grid"] },
    { id: "pricing-table", name: "Pricing Table", category: "layout", icon: Table, tags: ["pricing", "saas"] },
    { id: "testimonials", name: "Testimonials", category: "layout", icon: Star, tags: ["social proof"] },
    { id: "team-grid", name: "Team Grid", category: "layout", icon: User, tags: ["about", "team"] },
    
    // Content Components
    { id: "heading-1", name: "Heading 1", category: "content", icon: Type, tags: ["text", "heading"] },
    { id: "heading-2", name: "Heading 2", category: "content", icon: Type, tags: ["text", "heading"] },
    { id: "paragraph", name: "Paragraph", category: "content", icon: Type, tags: ["text", "body"] },
    { id: "image-banner", name: "Image Banner", category: "content", icon: Image, tags: ["media", "banner"] },
    { id: "video-embed", name: "Video Embed", category: "content", icon: Video, tags: ["media", "video"] },
    { id: "bullet-list", name: "Bullet List", category: "content", icon: List, tags: ["list", "content"] },
    
    // Form Components
    { id: "contact-form", name: "Contact Form", category: "form", icon: Mail, tags: ["form", "contact"], premium: true },
    { id: "newsletter-form", name: "Newsletter", category: "form", icon: Mail, tags: ["form", "email"] },
    { id: "search-bar", name: "Search Bar", category: "form", icon: Search, tags: ["search", "input"] },
    { id: "login-form", name: "Login Form", category: "form", icon: User, tags: ["auth", "form"], premium: true },
    
    // E-commerce Components
    { id: "product-card", name: "Product Card", category: "ecommerce", icon: ShoppingCart, tags: ["product", "shop"] },
    { id: "product-grid", name: "Product Grid", category: "ecommerce", icon: Grid3x3, tags: ["products", "shop"] },
    { id: "cart-widget", name: "Cart Widget", category: "ecommerce", icon: ShoppingCart, tags: ["cart"], premium: true },
    { id: "checkout-form", name: "Checkout Form", category: "ecommerce", icon: CreditCard, tags: ["checkout"], premium: true },
    
    // Navigation Components
    { id: "navbar-standard", name: "Standard Navbar", category: "navigation", icon: Menu, tags: ["nav", "header"] },
    { id: "navbar-centered", name: "Centered Navbar", category: "navigation", icon: Menu, tags: ["nav", "header"] },
    { id: "footer-standard", name: "Standard Footer", category: "navigation", icon: Menu, tags: ["footer"] },
    { id: "breadcrumb", name: "Breadcrumb", category: "navigation", icon: Menu, tags: ["navigation"] },
  ];

  const filteredComponents = components.filter(comp => {
    const matchesSearch = 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || comp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "All Components" },
    { id: "layout", label: "Layout" },
    { id: "content", label: "Content" },
    { id: "form", label: "Forms" },
    { id: "ecommerce", label: "E-commerce" },
    { id: "navigation", label: "Navigation" },
  ];

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Components Library
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag & drop pre-built components
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <Input
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
          {categories.map(cat => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {filteredComponents.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No components found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredComponents.map(comp => {
                  const Icon = comp.icon;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => onAddComponent(comp.id)}
                      className="group relative aspect-square rounded-lg border border-border bg-card hover:border-primary/50 transition-all overflow-hidden"
                    >
                      {/* Component Preview */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                        <div className="w-full h-full bg-muted/30 rounded border border-border/50 flex items-center justify-center">
                          <Icon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background to-transparent">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium truncate flex-1">
                            {comp.name}
                          </p>
                          {comp.premium && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
