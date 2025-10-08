// @ts-nocheck
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
    const { templateName, aesthetic, source, learningContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const darkModePremiumGuide = `
Design System: Dark Mode Premium (Sleek & Elegant)

Tokens (CSS custom properties expected):
- --primary-bg: #1a1a2e; --secondary-bg: #16213e; --card-bg: #0f3460;
- --text-color: #e0e0e0; --heading-color: #e94560; --accent-color: #e94560;
- --button-bg: linear-gradient(45deg, #e94560, #a81c3d);
- --button-hover-bg: linear-gradient(45deg, #a81c3d, #e94560);
- --border-color: #0f3460; --shadow-color: rgba(0,0,0,.4);
- --gradient-1: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
- --gradient-2: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
- Fonts: 'Poppins' for body, 'Montserrat' for headings.

Layout patterns:
- Sticky header with logo, nav links, hamburger menu for mobile.
- Hero section with gradient background, bold H1, and CTA button.
- Feature grid (cards with hover elevation and accent borders), testimonial grid, and CTA section.
- Mobile nav slides in from right; animations via fade/slide and IntersectionObserver.

Accessibility & responsiveness:
- Provide focus outlines on interactive elements.
- Ensure touch targets >= 44px.
- Media queries for 320px/768px/1024px breakpoints.
`;

    const systemPrompt = `You are an expert web designer and developer. Generate complete, production-ready HTML and CSS code based on the template request.

Rules:
- Use modern HTML5 semantic elements
- ALWAYS include <meta name="viewport" content="width=device-width, initial-scale=1.0"> in the <head>
- Use embedded CSS in <style> tags for all styling
- Make it fully responsive with mobile-first approach using media queries
- Include beautiful modern design with gradients, shadows, and animations
- Use proper accessibility attributes
- Include interactive elements with CSS transitions and hover effects
- Follow the aesthetic and style requested
- Generate complete, self-contained HTML that works standalone
- Use modern CSS features like flexbox, grid, custom properties
- Include beautiful typography and spacing
- Optimize for both large and small mobile devices (320px to 1920px)
- Use relative units (rem, em, %, vw, vh) instead of fixed pixel values where appropriate`;
 
    const includeDarkPremium = (aesthetic || '').toLowerCase().includes('dark mode premium') || (templateName || '').toLowerCase().includes('dark mode premium');

    const userPrompt = `Generate a complete HTML page for a "${templateName}" with ${aesthetic} aesthetic from ${source}.

${learningContext ? `
LEARNING CONTEXT - Previous Successful Templates:
${learningContext}

Based on the above patterns, create a NEW unique variation that:
- Builds upon successful design patterns while avoiding exact replication
- Introduces fresh layout ideas or interaction patterns
- Maintains high-quality responsive design principles
- Uses modern CSS techniques and accessibility standards
` : ''}
    
The page should be:
- A complete HTML document with <!DOCTYPE html>, <head>, and <body>
- MUST include <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>
- MUST include <meta charset="UTF-8"> in <head>
- Fully styled with embedded CSS in <style> tags
- Fully functional and interactive with CSS animations
- Beautifully styled with the ${aesthetic} aesthetic
- Mobile-first responsive design with breakpoints for small (320px), medium (768px), and large (1024px+) screens
- Include sample content that demonstrates the design
- Use modern design patterns and best practices
- Include smooth transitions and hover effects
- Use semantic HTML5 elements
- Use flexible layouts that adapt to any screen size
- Optimize touch targets for mobile (minimum 44px)

${includeDarkPremium ? `
IMPORTANT: Apply the following Dark Mode Premium style guide strictly:
${darkModePremiumGuide}
` : ''}

Return ONLY the complete HTML code with embedded CSS, nothing else. Make it production-ready, visually stunning, and perfectly optimized for all mobile devices.`;

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
        aesthetic,
        learningContext: learningContext ? 'Applied' : 'None'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate template' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});