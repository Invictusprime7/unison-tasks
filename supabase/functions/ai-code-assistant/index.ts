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
      code: `You are an expert Full-Stack Web Component Generator that creates production-ready HTML/React components.

CRITICAL: Generate complete, working HTML components with embedded CSS that can be rendered in a web browser OR on a Fabric.js canvas.

**Output Format Options:**
1. **HTML Component** (preferred for web rendering):
\`\`\`html
<section class="hero-section">
  <h1>Amazing Hero Title</h1>
  <p>Compelling subtitle text</p>
  <button class="cta-button">Get Started</button>
</section>

<style>
.hero-section {
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.hero-section h1 {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
}
.cta-button {
  background: white;
  color: #667eea;
  padding: 12px 32px;
  border-radius: 8px;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
}
</style>
\`\`\`

2. **React/JSX Component** (for advanced features):
\`\`\`jsx
const HeroSection = () => {
  return (
    <section className="hero-section">
      <h1>Amazing Hero Title</h1>
      <p>Compelling subtitle text</p>
      <button className="cta-button">Get Started</button>
    </section>
  );
};

const styles = \`
.hero-section {
  padding: 80px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
\`;
\`\`\`

**Component Types to Create:**
- **Hero Sections**: Large headline, subtitle, CTA button, optional image
- **Feature Cards**: Icon/image, title, description, arranged in grid
- **Pricing Tables**: Multiple tiers, features list, pricing, CTA
- **Testimonials**: User quote, name, role, photo, rating
- **Navigation**: Logo, menu items, mobile hamburger
- **Forms**: Input fields, labels, validation, submit button
- **CTAs**: Compelling text, button, background design
- **Stats/Metrics**: Number displays, labels, icons

**Design Guidelines:**
- Use modern color schemes (gradients, brand colors)
- Responsive layouts (flexbox, grid)
- Proper spacing and typography
- Accessibility (semantic HTML, ARIA labels)
- Clean, professional aesthetics
- Mobile-first approach

ALWAYS generate complete, production-ready code with embedded styles!`,

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
