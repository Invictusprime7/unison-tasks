import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompts = {
      code: `You are an expert web component designer for a visual canvas builder. When users ask you to create components, you should provide both a description AND structured data for rendering.

IMPORTANT: Always call the render_component tool to specify exactly how the component should be rendered on the canvas.

Provide clear descriptions and specifications for:
- Hero sections: Large background, heading, subtitle, CTA buttons
- Cards: Container boxes with titles, content, buttons
- Buttons: Interactive elements with text
- Navigation: Header bars with links and logos
- Pricing cards: Special cards with price, features, CTA
- Forms: Input fields and submit buttons
- Content sections: Text blocks with images

Be specific about colors (hex codes), sizes (pixels), positions, and styling.`,

      design: `You are a creative design consultant specializing in modern web design. You help users improve their designs with actionable recommendations.

Focus on:
1. Color theory and accessibility
2. Typography and readability
3. Layout and spacing
4. User experience patterns
5. Modern design trends
6. Responsive design principles

Provide specific, actionable suggestions with reasoning.`,

      review: `You are a senior code reviewer with expertise in React, TypeScript, and web development best practices.

Review code for:
1. Performance optimizations
2. Accessibility issues
3. Security vulnerabilities
4. Code structure and organization
5. TypeScript type safety
6. React best practices
7. Potential bugs

Provide constructive feedback with specific improvements.`
    };

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.code;

    const body: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true,
    };

    // Add tool calling for code mode to get structured component data
    if (mode === 'code') {
      body.tools = [
        {
          type: 'function',
          function: {
            name: 'render_component',
            description: 'Render a visual component on the Fabric.js canvas with specified elements and styling',
            parameters: {
              type: 'object',
              properties: {
                componentType: {
                  type: 'string',
                  enum: ['hero', 'card', 'button', 'navigation', 'pricing', 'form', 'section', 'custom'],
                  description: 'The type of component to render'
                },
                elements: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['rectangle', 'text', 'circle', 'image'] },
                      x: { type: 'number', description: 'X position in pixels' },
                      y: { type: 'number', description: 'Y position in pixels' },
                      width: { type: 'number', description: 'Width in pixels' },
                      height: { type: 'number', description: 'Height in pixels' },
                      fill: { type: 'string', description: 'Fill color (hex or gradient)' },
                      text: { type: 'string', description: 'Text content (for text elements)' },
                      fontSize: { type: 'number', description: 'Font size in pixels' },
                      fontWeight: { type: 'string', description: 'Font weight (normal, bold, 600, etc.)' },
                      textAlign: { type: 'string', enum: ['left', 'center', 'right'] },
                      rx: { type: 'number', description: 'Border radius X' },
                      ry: { type: 'number', description: 'Border radius Y' },
                      stroke: { type: 'string', description: 'Stroke color' },
                      strokeWidth: { type: 'number', description: 'Stroke width' }
                    },
                    required: ['type', 'x', 'y']
                  }
                },
                description: {
                  type: 'string',
                  description: 'Human-readable description of what was created'
                }
              },
              required: ['componentType', 'elements', 'description']
            }
          }
        }
      ];
      body.tool_choice = 'auto'; // Let the model decide when to use tools
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    console.error('Error in ai-code-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
