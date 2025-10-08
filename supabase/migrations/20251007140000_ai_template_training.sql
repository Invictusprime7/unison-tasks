-- Create table for storing AI template training data
CREATE TABLE IF NOT EXISTS public.ai_template_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  aesthetic TEXT NOT NULL,
  source TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  design_patterns TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  layout_structure TEXT,
  usage_count INTEGER DEFAULT 1,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  performance_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_template_training_aesthetic ON public.ai_template_training(aesthetic);
CREATE INDEX IF NOT EXISTS idx_ai_template_training_created_at ON public.ai_template_training(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_template_training_usage_count ON public.ai_template_training(usage_count DESC);

-- Enable RLS
ALTER TABLE public.ai_template_training ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all training data"
  ON public.ai_template_training FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own training data"
  ON public.ai_template_training FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own training data"
  ON public.ai_template_training FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update performance scores based on usage
CREATE OR REPLACE FUNCTION public.update_template_performance()
RETURNS trigger AS $$
BEGIN
  -- Calculate performance score based on usage count and rating
  NEW.performance_score = LEAST(5.0, 
    (NEW.usage_count::decimal / 10.0) + 
    COALESCE(NEW.user_rating::decimal / 5.0 * 2.0, 1.0)
  );
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_template_performance_trigger
  BEFORE UPDATE ON public.ai_template_training
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_performance();