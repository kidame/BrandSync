-- Create seo_analyses table (idempotent)
CREATE TABLE IF NOT EXISTS public.seo_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  seo_score INTEGER,
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  meta_description TEXT,
  has_meta_description BOOLEAN DEFAULT false,
  title_tag TEXT,
  has_viewport BOOLEAN DEFAULT false,
  is_crawlable BOOLEAN DEFAULT false,
  full_report JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SEO analyses are viewable by everyone" ON public.seo_analyses;
CREATE POLICY "SEO analyses are viewable by everyone" ON public.seo_analyses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage SEO analyses" ON public.seo_analyses;
CREATE POLICY "Authenticated users can manage SEO analyses" ON public.seo_analyses FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_seo_analyses_territory_id ON public.seo_analyses(territory_id);

DROP TRIGGER IF EXISTS update_seo_analyses_updated_at ON public.seo_analyses;
CREATE TRIGGER update_seo_analyses_updated_at
BEFORE UPDATE ON public.seo_analyses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
