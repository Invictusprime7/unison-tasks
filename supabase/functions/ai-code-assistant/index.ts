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
      code: `You are an expert Canvas Code Generator that creates executable code for a Fabric.js canvas using a simple API.

CRITICAL: When users ask you to create visual components, generate executable JavaScript code using these canvas functions:

**Available Canvas Functions:**
- addRect({ x, y, width, height, fill, cornerRadius, borderColor, borderWidth, opacity, rotation, ... })
- addCircle({ x, y, radius, fill, borderColor, borderWidth, opacity, ... })
- addText({ text, x, y, fontSize, color, fontFamily, fontWeight, fontStyle, align, ... })
- addPolygon(points[], { x, y, fill, borderColor, borderWidth, ... })
- addImage(url, { x, y, width, height, scale, rotation, opacity, ... })
- clearCanvas()
- setBackground(color)

**Code Generation Rules:**
1. Generate EXECUTABLE JavaScript code, not pseudocode
2. Use ONLY the functions listed above
3. Include comments to explain what you're creating
4. Start with setBackground() to set the canvas background
5. Use appropriate colors (hex codes like '#3b82f6')
6. Position elements with x, y coordinates
7. Make designs visually appealing with proper spacing

**Examples:**
\`\`\`javascript
// Modern hero section
setBackground('#f0f9ff');

addRect({
  x: 50, y: 100,
  width: 700, height: 300,
  fill: '#3b82f6',
  cornerRadius: 16
});

addText({
  text: 'Welcome to Canvas',
  x: 100, y: 180,
  fontSize: 48,
  color: '#ffffff',
  fontWeight: 'bold'
});
\`\`\`

ALWAYS provide working code that can be directly executed on the canvas!`,

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
