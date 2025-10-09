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
    const { prompt, currentHtml, currentCss } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received design assistant request:", { prompt });

    const systemPrompt = `You are an expert web designer and HTML/CSS developer. The user will describe changes they want to make to their web design, and you will return the modified HTML and CSS.

CURRENT STATE:
HTML:
${currentHtml || '<div>Empty canvas</div>'}

CSS:
${currentCss || ''}

INSTRUCTIONS:
1. Understand the user's natural language request
2. Modify the HTML and CSS to implement their request
3. Return ONLY valid HTML and CSS
4. Keep the design responsive and professional
5. Use modern CSS (flexbox, grid, etc.)
6. If adding new content, make it visually appealing
7. If user asks to change colors, update the CSS
8. If user asks to add elements, add them to the HTML
9. Preserve existing elements unless explicitly asked to remove them

Return your response in this EXACT JSON format:
{
  "html": "the complete modified HTML",
  "css": "the complete modified CSS",
  "explanation": "brief explanation of what you changed"
}`;

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
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
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
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("AI response received");

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("Invalid AI response format");
    }

    return new Response(
      JSON.stringify({
        html: parsedResponse.html || currentHtml,
        css: parsedResponse.css || currentCss,
        explanation: parsedResponse.explanation || "Design updated"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in ai-design-assistant:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});