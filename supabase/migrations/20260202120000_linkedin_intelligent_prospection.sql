-- ============================================
-- Migration : Prospection LinkedIn intelligente
-- Colonnes pour analyse IA, enrichissement entreprises, propositions commerciales
-- ============================================

-- --------------------------------------------------
-- 1. linkedin_job_searches : thèmes d'analyse (IA)
-- --------------------------------------------------
ALTER TABLE public.linkedin_job_searches
  ADD COLUMN IF NOT EXISTS analysis_themes JSONB;

COMMENT ON COLUMN public.linkedin_job_searches.analysis_themes IS 'Thèmes de recherche définis par l''utilisateur (interprétés largement par l''IA), ex: ["SEO", "branding", "création de contenu"]';

-- --------------------------------------------------
-- 2. linkedin_job_offers : résultat analyse IA
-- --------------------------------------------------
ALTER TABLE public.linkedin_job_offers
  ADD COLUMN IF NOT EXISTS analysis_result JSONB;

COMMENT ON COLUMN public.linkedin_job_offers.analysis_result IS 'Résultat de l''analyse IA : isRelevant, matchedThemes, confidence, detectedConcepts, reason';

-- --------------------------------------------------
-- 3. linkedin_companies : enrichissement et prospection
-- --------------------------------------------------

-- Lien vers l'audit SEO (optionnel)
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS seo_audit_id UUID;

-- Contrainte FK uniquement si la colonne vient d'être ajoutée (éviter doublon)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'linkedin_companies_seo_audit_id_fkey'
  ) THEN
    ALTER TABLE public.linkedin_companies
      ADD CONSTRAINT linkedin_companies_seo_audit_id_fkey
      FOREIGN KEY (seo_audit_id) REFERENCES public.seo_analyses(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.linkedin_companies.seo_audit_id IS 'Référence vers l''audit SEO (seo_analyses)';

-- Analyse activité entreprise (secteur, services, besoins)
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS company_analysis JSONB;

COMMENT ON COLUMN public.linkedin_companies.company_analysis IS 'Résultat analyze-company-activity : sector, industry, services, aboutSummary, identifiedNeeds, companySize, targetAudience';

-- Score de pertinence (0-100) basé sur l'analyse de l'offre
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS relevance_score INTEGER;

ALTER TABLE public.linkedin_companies
  DROP CONSTRAINT IF EXISTS linkedin_companies_relevance_score_check;

ALTER TABLE public.linkedin_companies
  ADD CONSTRAINT linkedin_companies_relevance_score_check
  CHECK (relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 100));

COMMENT ON COLUMN public.linkedin_companies.relevance_score IS 'Score de pertinence 0-100 (confidence de l''analyse IA de l''offre)';

-- Statut de la proposition commerciale
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS proposal_status TEXT;

ALTER TABLE public.linkedin_companies
  DROP CONSTRAINT IF EXISTS linkedin_companies_proposal_status_check;

ALTER TABLE public.linkedin_companies
  ADD CONSTRAINT linkedin_companies_proposal_status_check
  CHECK (proposal_status IS NULL OR proposal_status IN ('draft', 'sent', 'responded'));

COMMENT ON COLUMN public.linkedin_companies.proposal_status IS 'Statut de la proposition : draft, sent, responded';

-- Proposition commerciale générée (texte du message)
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS custom_proposal TEXT;

COMMENT ON COLUMN public.linkedin_companies.custom_proposal IS 'Message de prospection généré par l''IA';

-- Date de dernière analyse (enrichissement + proposition)
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.linkedin_companies.analyzed_at IS 'Date de dernière analyse (enrichissement et génération de proposition)';

-- --------------------------------------------------
-- 4. seo_analyses : territory_id nullable (audits LinkedIn)
-- --------------------------------------------------
ALTER TABLE public.seo_analyses
  ALTER COLUMN territory_id DROP NOT NULL;

COMMENT ON COLUMN public.seo_analyses.territory_id IS 'Territoire (optionnel : NULL pour les audits liés à la prospection LinkedIn)';

-- --------------------------------------------------
-- Index optionnel pour les requêtes par statut / pertinence
-- --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_linkedin_companies_proposal_status
  ON public.linkedin_companies(proposal_status)
  WHERE proposal_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_linkedin_companies_seo_audit_id
  ON public.linkedin_companies(seo_audit_id)
  WHERE seo_audit_id IS NOT NULL;
