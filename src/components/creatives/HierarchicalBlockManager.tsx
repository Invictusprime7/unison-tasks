import { useState } from "react";
import { Editor } from "grapesjs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  LayoutGrid,
  Navigation,
  Menu,
  Type,
  Image,
  Film,
  FileText,
  BoxSelect,
  Star,
  Settings,
  Database,
  FormInput,
  Grid3x3,
  Layers,
} from "lucide-react";

interface HierarchicalBlockManagerProps {
  editor: Editor | null;
}

export const HierarchicalBlockManager = ({ editor }: HierarchicalBlockManagerProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const addBlock = (blockId: string) => {
    if (!editor) return;
    const block = editor.BlockManager.get(blockId);
    if (block) {
      editor.addComponents(block.get('content'));
    }
  };

  const blockCategories = {
    basics: {
      label: "Basics",
      icon: LayoutGrid,
      subcategories: {
        sections: {
          label: "Sections",
          icon: Layers,
          blocks: [
            { id: 'hero-section', label: 'Hero Section', preview: true },
            { id: 'feature-grid', label: 'Feature Grid', preview: true },
            { id: 'testimonial', label: 'Testimonials', preview: true },
            { id: 'cta-section', label: 'Call to Action', preview: true },
            { id: 'stats-section', label: 'Stats Section', preview: true },
            { id: 'pricing-table', label: 'Pricing Table', preview: true },
          ]
        },
        navigation: {
          label: "Navigation",
          icon: Navigation,
          blocks: [
            { id: 'navbar-component', label: 'Navigation Bar', preview: true },
            { id: 'footer-component', label: 'Footer', preview: true },
          ]
        },
        layout: {
          label: "Layout",
          icon: Grid3x3,
          blocks: [
            { id: 'column1', label: '1 Column', preview: true },
            { id: 'column2', label: '2 Columns', preview: true },
            { id: 'column3', label: '3 Columns', preview: true },
          ]
        }
      }
    },
    content: {
      label: "Content",
      icon: Type,
      subcategories: {
        text: {
          label: "Text",
          icon: Type,
          blocks: [
            { id: 'text', label: 'Text Block', preview: true },
            { id: 'text-basic', label: 'Paragraph', preview: true },
            { id: 'quote', label: 'Quote', preview: true },
          ]
        },
        media: {
          label: "Media",
          icon: Image,
          blocks: [
            { id: 'image', label: 'Image', preview: true },
            { id: 'video', label: 'Video', preview: true },
          ]
        }
      }
    },
    forms: {
      label: "Forms",
      icon: FormInput,
      subcategories: {
        forms: {
          label: "Form Elements",
          icon: FormInput,
          blocks: [
            { id: 'contact-form', label: 'Contact Form', preview: true },
          ]
        }
      }
    },
    components: {
      label: "Components",
      icon: BoxSelect,
      subcategories: {
        cards: {
          label: "Cards",
          icon: FileText,
          blocks: [
            { id: 'card-component', label: 'Card', preview: true },
          ]
        }
      }
    }
  };

  const filteredCategories = Object.entries(blockCategories).reduce((acc, [key, category]) => {
    if (searchQuery.trim() === "") {
      acc[key] = category;
      return acc;
    }

    const filtered = Object.entries(category.subcategories).reduce((subAcc, [subKey, subcategory]) => {
      const matchingBlocks = subcategory.blocks.filter(block =>
        block.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchingBlocks.length > 0) {
        subAcc[subKey] = { ...subcategory, blocks: matchingBlocks };
      }
      return subAcc;
    }, {} as any);

    if (Object.keys(filtered).length > 0) {
      acc[key] = { ...category, subcategories: filtered };
    }

    return acc;
  }, {} as any);

  return (
    <div className="h-full bg-background border-r border-border flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Hierarchical Categories */}
      <div className="flex-1 overflow-auto">
        <Accordion type="multiple" defaultValue={["basics"]} className="w-full">
          {Object.entries(filteredCategories).map(([categoryKey, category]: [string, any]) => {
            const Icon = category.icon;
            
            return (
              <AccordionItem key={categoryKey} value={categoryKey} className="border-b border-border/50">
                <AccordionTrigger className="px-3 py-2.5 hover:bg-muted/50 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span>{category.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <Accordion type="multiple" defaultValue={Object.keys(category.subcategories)}>
                    {Object.entries(category.subcategories).map(([subKey, subcategory]: [string, any]) => {
                      const SubIcon = subcategory.icon;
                      
                      return (
                        <AccordionItem key={subKey} value={subKey} className="border-none">
                          <AccordionTrigger className="px-6 py-2 hover:bg-muted/30 text-sm">
                            <div className="flex items-center gap-2">
                              {SubIcon && <SubIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="text-muted-foreground">{subcategory.label}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-1">
                            <div className="space-y-0.5">
                              {subcategory.blocks.map((block: any) => (
                                <button
                                  key={block.id}
                                  onClick={() => addBlock(block.id)}
                                  className="w-full px-9 py-2 text-left text-sm hover:bg-muted/50 transition-colors rounded-sm group"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-12 h-8 bg-muted/70 rounded border border-border/50 group-hover:border-primary/30 transition-colors flex items-center justify-center">
                                      <div className="w-8 h-5 bg-background/80 rounded-sm"></div>
                                    </div>
                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                      {block.label}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};
