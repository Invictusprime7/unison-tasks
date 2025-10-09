import { useEditor, Element } from "@craftjs/core";
import { Container } from "./Container";
import { CraftButton } from "./Button";
import { CraftText } from "./Text";
import { CraftCard } from "./Card";
import { CraftImage } from "./Image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Type, MousePointer, CreditCard, Image } from "lucide-react";

export const CraftComponentsPanel = () => {
  const { connectors } = useEditor();

  const components = [
    {
      name: "Container",
      icon: Box,
      component: Container,
      props: { padding: "24px", background: "hsl(var(--muted))", canvas: true },
    },
    {
      name: "Text",
      icon: Type,
      component: CraftText,
      props: { text: "Add your text here" },
    },
    {
      name: "Button",
      icon: MousePointer,
      component: CraftButton,
      props: { text: "Click me" },
    },
    {
      name: "Card",
      icon: CreditCard,
      component: CraftCard,
      props: { canvas: true },
    },
    {
      name: "Image",
      icon: Image,
      component: CraftImage,
      props: {},
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Components</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag components to the canvas
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {components.map((comp) => {
            const Icon = comp.icon;
            return (
              <div
                key={comp.name}
                ref={(ref) => {
                  if (ref) {
                    connectors.create(
                      ref,
                      <Element is={comp.component} {...comp.props} />
                    );
                  }
                }}
                className="p-3 border rounded-lg cursor-move hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{comp.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
