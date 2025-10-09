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
    const { prompt, canvasState, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert web design AI assistant integrated with GrapeJS, a professional web builder.

Your role is to help users create web designs by generating GrapeJS component structures based on their natural language requests.

CRITICAL RULES:
1. ALWAYS return valid JSON in this exact structure:
{
  "components": [
    {
      "tagName": "section" | "div" | "h1" | "h2" | "h3" | "p" | "button" | "img" | "a",
      "type": "text" | "image" | "button" | "default",
      "content": "text content here",
      "attributes": {
        "id": "unique-id",
        "class": "css-classes",
        "src": "image-url",
        "href": "link-url",
        "alt": "alt text"
      },
      "style": {
        "display": "flex" | "block" | "inline-block",
        "flexDirection": "row" | "column",
        "alignItems": "center" | "flex-start" | "flex-end",
        "justifyContent": "center" | "space-between" | "flex-start",
        "padding": "20px",
        "margin": "10px 0",
        "backgroundColor": "#ffffff",
        "color": "#000000",
        "fontSize": "16px",
        "fontWeight": "normal" | "bold",
        "borderRadius": "8px",
        "width": "100%",
        "maxWidth": "1200px"
      },
      "components": []  // nested components
    }
  ],
  "explanation": "Brief explanation of what was created"
}

2. Create semantic HTML structures:
   - Use proper HTML5 tags (section, article, nav, header, footer, main)
   - Nest components properly
   - Include meaningful class names

3. Use modern, responsive CSS:
   - Flexbox for layouts
   - Relative units (%, rem, em)
   - Professional color schemes
   - Mobile-first responsive design
   - Modern spacing and typography

4. For different requests:
   - "Add a button" → Create a button element with proper styling
   - "Create a hero section" → Create section with heading, text, and CTA
   - "Add a card" → Create div with shadow, border-radius, padding
   - "Create navigation" → Create nav with flex layout
   - "Add form" → Create form elements with labels and inputs

5. Common component patterns:
   - Hero Section: section > div > h1 + p + button
   - Card: div > img + div > h3 + p
   - Navigation: nav > ul > li > a
   - Feature Grid: section > div (flex) > multiple feature cards
   - Footer: footer > div (flex) > columns

6. Style best practices:
   - Use flexbox for layouts
   - Consistent spacing (multiples of 8px)
   - Professional typography (16px base)
   - Good contrast ratios
   - Border radius for modern look (8px, 12px)

Current canvas state: ${JSON.stringify(canvasState || {})}
Action type: ${action || 'create'}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations outside the JSON structure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
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
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(content);
      console.log("GrapeJS AI Response:", JSON.stringify(aiResponse, null, 2));
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate response structure
    if (!aiResponse.components || !Array.isArray(aiResponse.components)) {
      throw new Error("Invalid response structure: missing components array");
    }

    return new Response(
      JSON.stringify(aiResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in web-builder-ai function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
