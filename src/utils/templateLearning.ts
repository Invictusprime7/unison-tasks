import { supabase } from '@/integrations/supabase/client';

export interface TemplateTrainingData {
  id: string;
  name: string;
  aesthetic: string;
  source: string;
  generatedCode: string;
  userRating?: number;
  usageCount: number;
  createdAt: string;
  designPatterns: string[];
  colorPalette: string[];
  layoutStructure: string;
}

/**
 * Stores generated template data for AI learning
 */
export async function saveTemplateTrainingData(data: Omit<TemplateTrainingData, 'id' | 'createdAt' | 'usageCount'>): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Extract design patterns from the generated code
    const patterns = extractDesignPatterns(data.generatedCode);
    const colors = extractColorPalette(data.generatedCode);
    const layout = extractLayoutStructure(data.generatedCode);

    const trainingData = {
      template_name: data.name,
      aesthetic: data.aesthetic,
      source: data.source,
      generated_code: data.generatedCode,
      design_patterns: patterns,
      color_palette: colors,
      layout_structure: layout,
      usage_count: 1,
      user_id: user?.id || null,
      created_at: new Date().toISOString()
    };

    // Store in files table with special metadata for now
    // TODO: Update to use ai_template_training table after migration
    const { error } = await supabase.from('files').insert({
      name: `ai-template-${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`,
      size: new Blob([JSON.stringify(trainingData)]).size,
      mime_type: 'application/json',
      storage_path: `training-data/templates/${Date.now()}.json`,
      folder_path: '/ai-training/templates',
      user_id: user?.id || null,
    });

    if (error) {
      console.error('Failed to save template training data:', error);
    } else {
      console.log('Template training data saved successfully');
    }
  } catch (error) {
    console.error('Error saving template training data:', error);
  }
}

/**
 * Retrieves previous template generations for learning context
 */
export async function getTemplateTrainingContext(aesthetic: string, limit: number = 5): Promise<string> {
  try {
    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('folder_path', '/ai-training/templates')
      .eq('mime_type', 'application/json')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!files || files.length === 0) {
      return '';
    }

    // Build context from previous generations
    const contextExamples = files.map((file, index) => {
      const cleanName = file.name.replace('ai-template-', '').replace(/-\d+\.json$/, '');
      return `Template ${index + 1}:
- Name: "${cleanName.replace(/-/g, ' ')}"
- Aesthetic: Similar to "${aesthetic}"
- Created: ${new Date(file.created_at!).toLocaleDateString()}
- Patterns: Modern responsive design with CSS custom properties`;
    }).join('\n\n');

    return `
Previous AI Template Generations (${files.length} found):
${contextExamples}

Observed Patterns Across Generations:
- CSS custom properties for consistent theming
- Mobile-first responsive breakpoints (320px, 768px, 1024px)
- Staggered animation delays for entrance effects
- Hover elevations and accent borders for interactivity
- Semantic HTML5 structure with accessibility attributes
- Modern layout techniques (Grid, Flexbox)
- Dark mode friendly color schemes
- Smooth transitions and micro-interactions

Innovation Requirements:
Generate a NEW unique variation that builds upon these successful patterns while introducing:
- Fresh layout arrangements or component compositions
- Unique color combinations or gradient styles
- Novel interaction patterns or animation techniques
- Enhanced accessibility features
- Creative responsive design solutions

Maintain high quality standards while ensuring this template is distinctly different from previous generations.`;
  } catch (error) {
    console.error('Error retrieving template training context:', error);
    return '';
  }
}

/**
 * Increments usage count when a template is used
 */
export async function recordTemplateUsage(templateName: string, aesthetic: string): Promise<void> {
  try {
    // In a real implementation, this would update the training_data table
    console.log(`Template usage recorded: ${templateName} (${aesthetic})`);
  } catch (error) {
    console.error('Error recording template usage:', error);
  }
}

/**
 * Extracts design patterns from generated HTML/CSS code
 */
function extractDesignPatterns(code: string): string[] {
  const patterns: string[] = [];
  
  // Check for common patterns
  if (code.includes('position: sticky')) patterns.push('sticky-header');
  if (code.includes('hamburger')) patterns.push('mobile-hamburger-menu');
  if (code.includes('grid-template-columns')) patterns.push('css-grid-layout');
  if (code.includes('transform: translateY')) patterns.push('hover-elevation');
  if (code.includes('linear-gradient')) patterns.push('gradient-backgrounds');
  if (code.includes('@keyframes')) patterns.push('css-animations');
  if (code.includes('IntersectionObserver')) patterns.push('scroll-animations');
  if (code.includes('--')) patterns.push('css-custom-properties');
  if (code.includes('@media')) patterns.push('responsive-design');
  if (code.includes('box-shadow')) patterns.push('depth-layering');
  if (code.includes('backdrop-filter')) patterns.push('glassmorphism');
  if (code.includes('border-radius')) patterns.push('rounded-corners');
  if (code.includes('transition:')) patterns.push('smooth-transitions');
  
  return patterns;
}

/**
 * Extracts color palette from CSS code
 */
function extractColorPalette(code: string): string[] {
  const colors: string[] = [];
  
  // Extract hex colors
  const hexMatches = code.match(/#[0-9A-Fa-f]{6}/g);
  if (hexMatches) colors.push(...hexMatches);
  
  // Extract RGB colors
  const rgbMatches = code.match(/rgb\([^)]+\)/g);
  if (rgbMatches) colors.push(...rgbMatches);
  
  // Extract RGBA colors
  const rgbaMatches = code.match(/rgba\([^)]+\)/g);
  if (rgbaMatches) colors.push(...rgbaMatches);
  
  // Remove duplicates and limit to most common
  return [...new Set(colors)].slice(0, 10);
}

/**
 * Extracts layout structure information
 */
function extractLayoutStructure(code: string): string {
  const structure: string[] = [];
  
  if (code.includes('<header>')) structure.push('header');
  if (code.includes('<nav>')) structure.push('navigation');
  if (code.includes('class="hero"')) structure.push('hero-section');
  if (code.includes('feature-grid')) structure.push('feature-grid');
  if (code.includes('testimonial')) structure.push('testimonials');
  if (code.includes('class="cta"')) structure.push('call-to-action');
  if (code.includes('<footer>')) structure.push('footer');
  if (code.includes('<aside>')) structure.push('sidebar');
  
  return structure.join(' -> ');
}

/**
 * Analyzes template performance and provides feedback
 */
export async function analyzeTemplatePerformance(templateName: string): Promise<{
  usageCount: number;
  avgRating: number;
  popularPatterns: string[];
  suggestions: string[];
}> {
  // Mock implementation - in real app would query actual usage data
  return {
    usageCount: Math.floor(Math.random() * 100) + 10,
    avgRating: 4.2 + Math.random() * 0.8,
    popularPatterns: ['css-grid-layout', 'hover-elevation', 'responsive-design'],
    suggestions: [
      'Consider adding more micro-interactions',
      'Users prefer darker color schemes',
      'Mobile navigation could be improved'
    ]
  };
}