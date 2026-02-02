-- ============================================
-- Migration : SEO Analysis étendu (Mobile + Desktop + données Lighthouse)
-- Colonnes pour scores desktop, rapport desktop, et données extraites
-- ============================================

-- Scores desktop (mobile = colonnes existantes)
ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS desktop_scores JSONB;

COMMENT ON COLUMN public.seo_analyses.desktop_scores IS 'Scores Lighthouse desktop : { seo, performance, accessibility, bestPractices }';

-- Rapport Lighthouse desktop (mobile = full_report)
ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS full_report_desktop JSONB;

COMMENT ON COLUMN public.seo_analyses.full_report_desktop IS 'Rapport Lighthouse complet pour strategy=desktop';

-- Données extraites (à partir du rapport mobile)
ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS images_without_alt JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.images_without_alt IS 'Images sans attribut alt : [{ src, snippet, selector }]';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS links_without_text JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.links_without_text IS 'Liens sans texte descriptif : [{ href, snippet }]';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS render_blocking_resources JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.render_blocking_resources IS 'Ressources bloquant le rendu : [{ url, totalBytes, wastedMs }]';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS unused_javascript JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.unused_javascript IS 'JavaScript inutilisé : [{ url, totalBytes, wastedBytes }]';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS unused_css JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.unused_css IS 'CSS inutilisé : [{ url, totalBytes, wastedBytes }]';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS page_size_bytes BIGINT;

COMMENT ON COLUMN public.seo_analyses.page_size_bytes IS 'Taille totale de la page (octets)';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS request_count INTEGER;

COMMENT ON COLUMN public.seo_analyses.request_count IS 'Nombre de requêtes réseau';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS has_sitemap BOOLEAN;

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS has_robots_txt BOOLEAN;

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS has_structured_data BOOLEAN;

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS structured_data_types JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.structured_data_types IS 'Types de données structurées détectés : ["Article", "Organization", ...]';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS open_graph_tags JSONB;

COMMENT ON COLUMN public.seo_analyses.open_graph_tags IS 'Meta Open Graph : { ogTitle, ogDescription, ogImage, hasTwitterCards }';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS h1_tags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS h2_tags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS h3_tags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.h1_tags IS 'Contenu des balises H1 (liste)';

ALTER TABLE public.seo_analyses
  ADD COLUMN IF NOT EXISTS color_contrast_issues JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_analyses.color_contrast_issues IS 'Éléments avec contraste insuffisant : [{ element, contrastRatio, expectedRatio }]';
