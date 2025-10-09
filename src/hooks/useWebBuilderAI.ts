import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Canvas as FabricCanvas, Rect, Circle, IText, Textbox, FabricImage } from 'fabric';
import { toast } from 'sonner';

export interface AICanvasObject {
  type: 'rect' | 'circle' | 'text' | 'textbox' | 'image' | 'group';
  left: number;
  top: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  src?: string;
  radius?: number;
  rx?: number;
  ry?: number;
  shadow?: any;
}

export interface AIResponse {
  objects: AICanvasObject[];
  explanation: string;
}

export const useWebBuilderAI = (fabricCanvas: FabricCanvas | null) => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

  const generateDesign = async (prompt: string, action: 'create' | 'modify' = 'create'): Promise<AIResponse | null> => {
    if (!fabricCanvas) {
      toast.error('Canvas not ready');
      return null;
    }

    setLoading(true);
    try {
      // Get current canvas state for context
      const canvasState = {
        objects: fabricCanvas.getObjects().length,
        dimensions: {
          width: fabricCanvas.width,
          height: fabricCanvas.height
        }
      };

      const { data, error } = await supabase.functions.invoke('web-builder-ai', {
        body: { 
          prompt,
          canvasState,
          action
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message.includes('402')) {
          toast.error('Payment required. Please add credits to your workspace.');
        } else {
          toast.error('Failed to generate design: ' + error.message);
        }
        return null;
      }

      const aiResponse = data as AIResponse;
      setLastResponse(aiResponse);

      // Add objects to canvas
      await addObjectsToCanvas(aiResponse.objects);

      toast.success(aiResponse.explanation || 'Design generated successfully!');
      return aiResponse;
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addObjectsToCanvas = async (objects: AICanvasObject[]) => {
    if (!fabricCanvas) return;

    for (const obj of objects) {
      try {
        let fabricObj;

        switch (obj.type) {
          case 'rect':
            fabricObj = new Rect({
              left: obj.left,
              top: obj.top,
              width: obj.width || 200,
              height: obj.height || 100,
              fill: obj.fill || '#3b82f6',
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth || 0,
              rx: obj.rx || 0,
              ry: obj.ry || 0,
              shadow: obj.shadow,
            });
            break;

          case 'circle':
            fabricObj = new Circle({
              left: obj.left,
              top: obj.top,
              radius: obj.radius || 50,
              fill: obj.fill || '#3b82f6',
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth || 0,
            });
            break;

          case 'text':
            fabricObj = new IText(obj.text || 'Text', {
              left: obj.left,
              top: obj.top,
              fill: obj.fill || '#000000',
              fontSize: obj.fontSize || 24,
              fontFamily: obj.fontFamily || 'Arial',
            });
            break;

          case 'textbox':
            fabricObj = new Textbox(obj.text || 'Text', {
              left: obj.left,
              top: obj.top,
              width: obj.width || 200,
              fill: obj.fill || '#000000',
              fontSize: obj.fontSize || 16,
              fontFamily: obj.fontFamily || 'Arial',
            });
            break;

          case 'image':
            if (obj.src) {
              try {
                fabricObj = await FabricImage.fromURL(obj.src, {
                  crossOrigin: 'anonymous'
                });
                fabricObj.set({
                  left: obj.left,
                  top: obj.top,
                  scaleX: obj.width ? obj.width / (fabricObj.width || 1) : 1,
                  scaleY: obj.height ? obj.height / (fabricObj.height || 1) : 1,
                });
              } catch (error) {
                console.error('Error loading image:', error);
                toast.error('Failed to load image: ' + obj.src);
                continue;
              }
            }
            break;
        }

        if (fabricObj) {
          fabricCanvas.add(fabricObj);
        }
      } catch (error) {
        console.error('Error adding object to canvas:', error);
      }
    }

    fabricCanvas.renderAll();
  };

  return {
    loading,
    lastResponse,
    generateDesign,
  };
};