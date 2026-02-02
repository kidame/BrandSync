-- ============================================
-- Migration : Fusion des doublons linkedin_companies
-- Même entreprise (territory_id + nom normalisé) en plusieurs lignes → une seule conservée,
-- linkedin_job_offers.company_id mis à jour vers la ligne conservée.
-- ============================================

-- 1) Mettre à jour les offres qui pointent vers une ligne "doublon" vers la ligne canonique
--    (on garde la ligne avec website_url / custom_proposal en priorité, sinon la plus ancienne par id)
WITH norm AS (
  SELECT
    id,
    territory_id,
    LOWER(TRIM(name)) AS norm_name,
    ROW_NUMBER() OVER (
      PARTITION BY territory_id, LOWER(TRIM(name))
      ORDER BY
        (website_url IS NOT NULL AND TRIM(COALESCE(website_url, '')) != '') DESC,
        (custom_proposal IS NOT NULL) DESC,
        id ASC
    ) AS rn
  FROM public.linkedin_companies
),
canonical AS (
  SELECT id AS canonical_id, territory_id, norm_name
  FROM norm
  WHERE rn = 1
),
duplicate_ids AS (
  SELECT n.id AS duplicate_id, c.canonical_id
  FROM norm n
  JOIN canonical c ON c.territory_id = n.territory_id AND c.norm_name = n.norm_name
  WHERE n.rn > 1
)
UPDATE public.linkedin_job_offers o
SET company_id = d.canonical_id
FROM duplicate_ids d
WHERE o.company_id = d.duplicate_id;

-- 2) Supprimer les lignes doublons (tout sauf la canonique par groupe)
WITH norm AS (
  SELECT
    id,
    territory_id,
    LOWER(TRIM(name)) AS norm_name,
    ROW_NUMBER() OVER (
      PARTITION BY territory_id, LOWER(TRIM(name))
      ORDER BY
        (website_url IS NOT NULL AND TRIM(COALESCE(website_url, '')) != '') DESC,
        (custom_proposal IS NOT NULL) DESC,
        id ASC
    ) AS rn
  FROM public.linkedin_companies
)
DELETE FROM public.linkedin_companies
WHERE id IN (SELECT id FROM norm WHERE rn > 1);
