-- ============================================
-- LinkedIn Jobs & Prospection - Kernel (idempotent)
-- ============================================

CREATE TABLE IF NOT EXISTS public.linkedin_job_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  search_keywords TEXT NOT NULL,
  location TEXT,
  search_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  scraping_job_id UUID REFERENCES public.scraping_jobs(id) ON DELETE SET NULL,
  offers_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.linkedin_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  linkedin_url TEXT,
  website_url TEXT,
  website_checked BOOLEAN DEFAULT false,
  website_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.linkedin_job_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.linkedin_job_searches(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.linkedin_companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_linkedin_url TEXT,
  job_title TEXT NOT NULL,
  job_url TEXT,
  job_location TEXT,
  job_description TEXT,
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.linkedin_prospecting (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.linkedin_companies(id) ON DELETE CASCADE,
  proposal_title TEXT,
  proposal_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'replied', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.linkedin_job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_prospecting ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "LinkedIn job searches viewable by everyone" ON public.linkedin_job_searches;
CREATE POLICY "LinkedIn job searches viewable by everyone" ON public.linkedin_job_searches FOR SELECT USING (true);
DROP POLICY IF EXISTS "LinkedIn job searches manageable" ON public.linkedin_job_searches;
CREATE POLICY "LinkedIn job searches manageable" ON public.linkedin_job_searches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "LinkedIn companies viewable by everyone" ON public.linkedin_companies;
CREATE POLICY "LinkedIn companies viewable by everyone" ON public.linkedin_companies FOR SELECT USING (true);
DROP POLICY IF EXISTS "LinkedIn companies manageable" ON public.linkedin_companies;
CREATE POLICY "LinkedIn companies manageable" ON public.linkedin_companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "LinkedIn job offers viewable by everyone" ON public.linkedin_job_offers;
CREATE POLICY "LinkedIn job offers viewable by everyone" ON public.linkedin_job_offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "LinkedIn job offers manageable" ON public.linkedin_job_offers;
CREATE POLICY "LinkedIn job offers manageable" ON public.linkedin_job_offers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "LinkedIn prospecting viewable by everyone" ON public.linkedin_prospecting;
CREATE POLICY "LinkedIn prospecting viewable by everyone" ON public.linkedin_prospecting FOR SELECT USING (true);
DROP POLICY IF EXISTS "LinkedIn prospecting manageable" ON public.linkedin_prospecting;
CREATE POLICY "LinkedIn prospecting manageable" ON public.linkedin_prospecting FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_linkedin_job_searches_territory ON public.linkedin_job_searches(territory_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_job_searches_status ON public.linkedin_job_searches(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_companies_territory ON public.linkedin_companies(territory_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_job_offers_search ON public.linkedin_job_offers(search_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_job_offers_company ON public.linkedin_job_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_prospecting_company ON public.linkedin_prospecting(company_id);

DROP TRIGGER IF EXISTS update_linkedin_companies_updated_at ON public.linkedin_companies;
CREATE TRIGGER update_linkedin_companies_updated_at
  BEFORE UPDATE ON public.linkedin_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_linkedin_prospecting_updated_at ON public.linkedin_prospecting;
CREATE TRIGGER update_linkedin_prospecting_updated_at
  BEFORE UPDATE ON public.linkedin_prospecting
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
