# AI Template Learning System

This directory contains reference templates and the AI learning infrastructure for the Web Design Kit.

## How it works

1. **Reference Templates**: Static HTML templates in `/public/templates/` serve as learning anchors
2. **Generation with Context**: AI generates new templates using learning context from previous generations
3. **Pattern Extraction**: Each generated template is analyzed for design patterns, colors, and layout structures
4. **Feedback Loop**: New templates become training data for future generations

## Files

- `dark-mode-premium.html` - Reference template for Dark Mode Premium aesthetic
- More reference templates can be added here

## Integration

The learning system is integrated into:
- `src/components/creatives/WebDesignKit.tsx` - UI for template generation
- `src/utils/templateLearning.ts` - Core learning functions
- `supabase/functions/generate-template/index.ts` - AI generation with context
- `supabase/migrations/20251007140000_ai_template_training.sql` - Database schema

## Usage

When generating templates:
1. System retrieves context from previous generations
2. AI uses this context to create unique variations
3. Generated template is saved for future learning
4. Patterns are extracted and stored for analysis

This creates a continuous learning loop where each generation improves upon the last while maintaining uniqueness.