-- ============================================
-- BrandSync Kernel - Essential Database Schema (idempotent)
-- ============================================

-- Table: territories
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: brand_dna_reports
CREATE TABLE IF NOT EXISTS public.brand_dna_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_images INTEGER NOT NULL DEFAULT 0,
  sentiment_score NUMERIC(3,2) CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  engagement_rate NUMERIC(5,2),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  visual_identity JSONB NOT NULL DEFAULT '{}'::jsonb,
  semantic_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  audience_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: scraping_jobs
CREATE TABLE IF NOT EXISTS public.scraping_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary JSONB,
  posts_count INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_dna_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Territories are viewable by everyone" ON public.territories;
CREATE POLICY "Territories are viewable by everyone" ON public.territories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Brand DNA reports are viewable by everyone" ON public.brand_dna_reports;
CREATE POLICY "Brand DNA reports are viewable by everyone" ON public.brand_dna_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Scraping jobs are viewable by everyone" ON public.scraping_jobs;
CREATE POLICY "Scraping jobs are viewable by everyone" ON public.scraping_jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage territories" ON public.territories;
CREATE POLICY "Authenticated users can manage territories" ON public.territories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage reports" ON public.brand_dna_reports;
CREATE POLICY "Authenticated users can manage reports" ON public.brand_dna_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage scraping jobs" ON public.scraping_jobs;
CREATE POLICY "Authenticated users can manage scraping jobs" ON public.scraping_jobs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reports_territory ON public.brand_dna_reports(territory_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON public.brand_dna_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_territory ON public.scraping_jobs(territory_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON public.scraping_jobs(status);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_territories_updated_at ON public.territories;
CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON public.territories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.brand_dna_reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.brand_dna_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
