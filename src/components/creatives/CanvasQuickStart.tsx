import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { 
  Copy, 
  Sparkles, 
  Square, 
  Circle, 
  Type, 
  Image as ImageIcon,
  Palette,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const codeExamples = [
  {
    id: 'basic-shapes',
    title: 'Basic Shapes',
    icon: Square,
    description: 'Rectangle and circle examples',
    code: `// Create basic shapes
addRect({
  x: 100, y: 100,
  width: 200, height: 150,
  fill: '#3b82f6',
  cornerRadius: 8
});

addCircle({
  x: 400, y: 175,
  radius: 75,
  fill: '#ec4899',
  borderColor: '#be185d',
  borderWidth: 2
});`
  },
  {
    id: 'text-elements',
    title: 'Text Elements',
    icon: Type,
    description: 'Add styled text to canvas',
    code: `// Add text elements
addText({
  text: 'Canvas Heading',
  x: 100, y: 50,
  fontSize: 36,
  color: '#1e40af',
  fontWeight: 'bold',
  fontFamily: 'Arial'
});

addText({
  text: 'Subtitle text here',
  x: 100, y: 95,
  fontSize: 18,
  color: '#64748b'
});`
  },
  {
    id: 'card-component',
    title: 'Card Component',
    icon: Layers,
    description: 'Create a styled card',
    code: `// Modern card design
setBackground('#f8fafc');

// Card background
addRect({
  x: 100, y: 100,
  width: 400, height: 250,
  fill: '#ffffff',
  cornerRadius: 16,
  borderColor: '#e2e8f0',
  borderWidth: 1
});

// Card header
addRect({
  x: 100, y: 100,
  width: 400, height: 60,
  fill: '#6366f1',
  cornerRadius: 16
});

// Title
addText({
  text: 'Card Title',
  x: 120, y: 120,
  fontSize: 24,
  color: '#ffffff',
  fontWeight: 'bold'
});

// Content
addText({
  text: 'This is the card content area.\\nYou can add multiple lines here.',
  x: 120, y: 185,
  fontSize: 16,
  color: '#334155'
});`
  },
  {
    id: 'button-design',
    title: 'Button Design',
    icon: Square,
    description: 'Create styled buttons',
    code: `// Primary button
addRect({
  x: 150, y: 200,
  width: 160, height: 48,
  fill: '#3b82f6',
  cornerRadius: 8
});

addText({
  text: 'Click Me',
  x: 195, y: 215,
  fontSize: 16,
  color: '#ffffff',
  fontWeight: '600'
});

// Secondary button
addRect({
  x: 330, y: 200,
  width: 160, height: 48,
  fill: '#ffffff',
  cornerRadius: 8,
  borderColor: '#3b82f6',
  borderWidth: 2
});

addText({
  text: 'Cancel',
  x: 380, y: 215,
  fontSize: 16,
  color: '#3b82f6',
  fontWeight: '600'
});`
  },
  {
    id: 'polygon-shapes',
    title: 'Polygon Shapes',
    icon: Sparkles,
    description: 'Create triangles and custom shapes',
    code: `// Triangle
addPolygon([
  { x: 0, y: -60 },
  { x: -60, y: 60 },
  { x: 60, y: 60 }
], {
  x: 200, y: 200,
  fill: '#10b981',
  borderColor: '#059669',
  borderWidth: 2
});

// Star shape
addPolygon([
  { x: 0, y: -50 },
  { x: 15, y: -15 },
  { x: 50, y: -15 },
  { x: 20, y: 10 },
  { x: 30, y: 50 },
  { x: 0, y: 25 },
  { x: -30, y: 50 },
  { x: -20, y: 10 },
  { x: -50, y: -15 },
  { x: -15, y: -15 }
], {
  x: 450, y: 200,
  fill: '#f59e0b',
  borderColor: '#d97706',
  borderWidth: 2
});`
  },
  {
    id: 'gradient-background',
    title: 'Styled Background',
    icon: Palette,
    description: 'Set canvas background and overlay',
    code: `// Set background color
setBackground('#1e293b');

// Overlay rectangle with opacity
addRect({
  x: 0, y: 0,
  width: 800, height: 600,
  fill: '#6366f1',
  opacity: 0.1
});

// Center content
addText({
  text: 'Beautiful Canvas',
  x: 250, y: 250,
  fontSize: 48,
  color: '#ffffff',
  fontWeight: 'bold'
});`
  }
];

interface CanvasQuickStartProps {
  onCodeSelect: (code: string) => void;
  className?: string;
}

export const CanvasQuickStart: React.FC<CanvasQuickStartProps> = ({ 
  onCodeSelect,
  className 
}) => {
  const { toast } = useToast();

  const handleCopy = (code: string, title: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied!',
      description: `${title} example copied to clipboard`,
    });
  };

  const handleUse = (code: string, title: string) => {
    onCodeSelect(code);
    toast({
      title: 'Code loaded!',
      description: `${title} example ready to render`,
    });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-sm">Canvas Quick Start</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Click any example to load it into the editor
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {codeExamples.map((example) => {
            const Icon = example.icon;
            return (
              <Card 
                key={example.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500"
                onClick={() => handleUse(example.code, example.title)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{example.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(example.code, example.title);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {example.description}
                    </p>
                    <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                      <code className="text-muted-foreground">
                        {example.code.split('\n').slice(0, 3).join('\n')}
                        {example.code.split('\n').length > 3 && '\n...'}
                      </code>
                    </pre>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs space-y-2">
          <p className="font-semibold">Available Functions:</p>
          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
            <code>addRect()</code>
            <code>addCircle()</code>
            <code>addText()</code>
            <code>addPolygon()</code>
            <code>addImage()</code>
            <code>setBackground()</code>
          </div>
        </div>
      </div>
    </div>
  );
};
