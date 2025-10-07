import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert design system architect that generates structured template layouts.

Given a user's brief (industry, goal, target audience), generate a complete template structure with:
1. Sections (hero, content, gallery, CTA, footer)
2. Components within each section (text, images, buttons, shapes)
3. Layout constraints (width/height modes: fixed/hug/fill)
4. Flexbox properties (direction, alignment, justification, gap, padding)
5. Data bindings for dynamic content
6. Brand kit integration (colors, fonts)

Output MUST be valid JSON matching this structure:
{
  "name": "Template Name",
  "description": "Brief description",
  "industry": "industry type",
  "brandKit": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "fonts": {
      "heading": "Font Name",
      "body": "Font Name",
      "accent": "Font Name"
    }
  },
  "sections": [
    {
      "id": "unique-id",
      "name": "Section Name",
      "type": "hero|content|gallery|cta|footer|custom",
      "constraints": {
        "width": { "mode": "fill" },
        "height": { "mode": "hug" },
        "padding": { "top": 40, "right": 20, "bottom": 40, "left": 20 },
        "gap": 20,
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center"
      },
      "components": [
        {
          "id": "unique-component-id",
          "type": "text|image|shape|container|button",
          "name": "Component Name",
          "constraints": {
            "width": { "mode": "hug" },
            "height": { "mode": "fixed", "value": 60 }
          },
          "dataBinding": {
            "field": "title",
            "type": "text",
            "defaultValue": "Default Title"
          },
          "style": {
            "backgroundColor": "#hex",
            "borderRadius": 8,
            "opacity": 1
          },
          "fabricProps": {
            "fontSize": 48,
            "fontFamily": "Font Name",
            "fill": "#hex",
            "fontWeight": "bold"
          }
        }
      ]
    }
  ],
  "variants": [
    {
      "id": "variant-id",
      "name": "Desktop",
      "size": { "width": 1920, "height": 1080 },
      "format": "web"
    }
  ],
  "data": {
    "title": "Sample Title",
    "subtitle": "Sample Subtitle",
    "cta": "Get Started"
  }
}

CRITICAL RULES:
- Use semantic section types (hero, content, gallery, cta, footer)
- Apply Auto Layout principles: use "hug" for content-sized, "fill" for responsive, "fixed" for specific sizes
- Include data bindings for all dynamic content (titles, images, prices, etc.)
- Use flexbox for proper alignment and spacing
- Generate multiple variants for different formats (web, social media, presentation)
- Ensure color harmony and font pairing in brand kit
- Add padding and gap for proper spacing`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt.description }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_template_structure",
              description: "Generate a complete template structure with sections, components, and layouts",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  industry: { type: "string" },
                  brandKit: {
                    type: "object",
                    properties: {
                      primaryColor: { type: "string" },
                      secondaryColor: { type: "string" },
                      accentColor: { type: "string" },
                      fonts: {
                        type: "object",
                        properties: {
                          heading: { type: "string" },
                          body: { type: "string" },
                          accent: { type: "string" }
                        },
                        required: ["heading", "body", "accent"]
                      }
                    },
                    required: ["primaryColor", "secondaryColor", "accentColor", "fonts"]
                  },
                  sections: {
                    type: "array",
                    items: { type: "object" }
                  },
                  variants: {
                    type: "array",
                    items: { type: "object" }
                  },
                  data: { type: "object" }
                },
                required: ["name", "description", "brandKit", "sections", "variants", "data"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_template_structure" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No template generated");
    }

    const templateStructure = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ 
        template: {
          ...templateStructure,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating AI template:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
