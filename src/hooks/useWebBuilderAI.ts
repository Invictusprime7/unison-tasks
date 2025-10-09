import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AIGeneratedTemplate } from '@/types/template';
import type { GrapeJSComponent } from '@/hooks/useGrapeJS';

export interface AIGrapeJSResponse {
  components: GrapeJSComponent[];
  explanation: string;
}

export interface AITemplateResponse {
  template: AIGeneratedTemplate;
  explanation: string;
}

export const useWebBuilderAI = (
  fabricCanvas: any,
  onTemplateGenerated?: (template: AIGeneratedTemplate) => void
) => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIGrapeJSResponse | null>(null);

  const generateDesign = async (prompt: string, action: 'create' | 'modify' = 'create'): Promise<AIGrapeJSResponse | null> => {
    setLoading(true);
    try {
      const canvasState = {
        message: "Using GrapeJS editor"
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

      const aiResponse = data as AIGrapeJSResponse;
      setLastResponse(aiResponse);

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

  const generateTemplate = async (prompt: string): Promise<AITemplateResponse | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-template', {
        body: { 
          prompt,
          industry: 'web',
          goal: 'web-builder-template',
          format: 'web'
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message.includes('402')) {
          toast.error('Payment required. Please add credits to your workspace.');
        } else {
          toast.error('Failed to generate template: ' + error.message);
        }
        return null;
      }

      const aiTemplateResponse = data as AITemplateResponse;
      
      // Notify parent - template state will handle dual rendering
      if (onTemplateGenerated) {
        onTemplateGenerated(aiTemplateResponse.template);
      }

      toast.success(aiTemplateResponse.explanation || 'Template generated successfully!');
      return aiTemplateResponse;
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    lastResponse,
    generateDesign,
    generateTemplate,
  };
};