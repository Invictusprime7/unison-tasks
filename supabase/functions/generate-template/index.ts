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
    const { templateName, aesthetic, source } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert web designer and developer. Generate complete, production-ready React component code based on the template request. 
    
Rules:
- Use modern React with TypeScript
- Use Tailwind CSS for styling with semantic design tokens
- Include all necessary imports
- Make it responsive and accessible
- Use proper component structure
- Include interactive elements where appropriate
- Follow the aesthetic and style requested
- Generate complete, copy-paste ready code`;

    const userPrompt = `Generate a complete React component for a "${templateName}" with ${aesthetic} aesthetic from ${source}.
    
The component should be:
- Fully functional and interactive
- Beautifully styled with the ${aesthetic} aesthetic
- Responsive across all devices
- Include sample content that demonstrates the design
- Use modern UI patterns and best practices

Return ONLY the complete React component code, nothing else.`;

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to generate template');
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        code: generatedCode,
        templateName,
        aesthetic 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-template function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});