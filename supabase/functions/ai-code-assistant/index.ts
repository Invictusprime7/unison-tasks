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
      code: `You are an expert web developer and code generator for a visual web builder that uses Fabric.js canvas.

Your responses should:
1. Generate clean, production-ready React/TypeScript code
2. Focus on describing visual components that can be rendered on a canvas
3. Use descriptive language about layout, colors, typography, and spacing
4. Include clear component structure (hero sections, cards, buttons, navigation, etc.)
5. Be specific about design details

When describing components, include:
- Component type (hero, card, button, navigation, pricing, etc.)
- Layout and positioning
- Colors and gradients
- Typography (font sizes, weights, colors)
- Spacing and dimensions
- Interactive elements

Examples:
- "Create a hero section with gradient background from purple to blue, large white heading, subtitle, and CTA button"
- "Build a pricing card with white background, rounded corners, title, price in large text, feature list, and action button"
- "Design a modern navigation bar with logo on left, centered menu items, and CTA button on right"

Format your responses with clear code blocks using \`\`\`tsx for React components. The code will be parsed to create visual elements on a Fabric.js canvas.`,

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
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
