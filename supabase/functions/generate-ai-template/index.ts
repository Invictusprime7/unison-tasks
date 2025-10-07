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

    const systemPrompt = `You are an expert design template generator. Create beautiful, production-ready templates with actual visual content.

Your templates MUST use the new Zod-validated schema:
{
  "name": "string",
  "description": "string",
  "category": "social-media|web|presentation|print",
  "frames": [
    {
      "id": "frame-1",
      "name": "Main Frame",
      "width": 1080,
      "height": 1080,
      "background": "#ffffff",
      "layout": "free|flex-column|flex-row|grid",
      "gap": 20,
      "padding": 40,
      "layers": [
        {
          "type": "shape|text|image",
          "x": 0,
          "y": 0,
          "width": 200,
          "height": 100,
          "rotation": 0,
          "opacity": 1,
          "visible": true,
          "locked": false,
          // For text layers:
          "content": "Text content",
          "fontFamily": "Inter",
          "fontSize": 48,
          "fontWeight": "bold|normal",
          "fontStyle": "normal|italic",
          "textAlign": "left|center|right",
          "color": "#000000",
          "lineHeight": 1.2,
          "letterSpacing": 0,
          // For image layers:
          "src": "https://images.unsplash.com/...",
          "fit": "cover|contain|fill",
          "filters": [],
          "borderRadius": 0,
          // For shape layers:
          "shape": "rectangle|circle|ellipse",
          "fill": "#3b82f6",
          "stroke": "#000000",
          "strokeWidth": 0,
          "borderRadius": 8
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. ALWAYS create multiple visible layers - minimum 5 layers per frame
2. Use real Unsplash image URLs: https://images.unsplash.com/photo-{id}?w=800&q=80
3. Create visual hierarchy: backgrounds, images, text overlays, shapes
4. Use proper colors (hex format like #3b82f6)
5. Set appropriate dimensions and positions
6. Use layouts: "free" for absolute positioning, "flex-column" for vertical stacks
7. Create professional designs inspired by Canva, Figma templates

EXAMPLE TEMPLATE FOR E-COMMERCE:
- Background shape (full frame, gradient color)
- Hero image layer (product photo from Unsplash)
- Text layers: brand name, product title, price, description
- Shape layers: colored accent boxes, decorative elements
- Call-to-action button (shape + text)

Make it visually stunning and immediately usable!`;

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
        response_format: { type: "json_object" }
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
    const messageContent = data.choices[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error("No template generated");
    }

    const templateStructure = JSON.parse(messageContent);

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
