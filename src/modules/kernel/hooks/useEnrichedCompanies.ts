/**
 * Hook : chargement des entreprises enrichies (website + audit SEO ou analyse ou proposition).
 * Filtres : proposal_status, plage de score SEO, recherche par nom.
 * JOIN avec seo_analyses pour les scores, tri par analyzed_at DESC.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Analyse entreprise (company_analysis JSONB) */
export interface CompanyAnalysisData {
  sector?: string;
  industry?: string;
  services?: string[];
  aboutSummary?: string;
  identifiedNeeds?: string[];
  companySize?: string;
  targetAudience?: string;
}

/** Ligne seo_analyses (scores + rapport) */
export interface SEOAnalysisRow {
  id: string;
  seo_score: number | null;
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  full_report?: Record<string, unknown> | null;
  website_url?: string;
  meta_description?: string | null;
  has_meta_description?: boolean | null;
  title_tag?: string | null;
  has_viewport?: boolean | null;
  is_crawlable?: boolean | null;
  created_at?: string;
  analyzed_at?: string;
  territory_id?: string | null;
}

/** Annonce LinkedIn liée à l'entreprise (pour lien de vérification) */
export interface CompanyJobOffer {
  job_url: string | null;
  job_title: string | null;
}

/** Entreprise enrichie (linkedin_companies + seo merge) */
export interface EnrichedCompanyRow {
  id: string;
  name: string;
  linkedin_url: string | null;
  website_url: string | null;
  seo_audit_id: string | null;
  company_analysis: CompanyAnalysisData | null;
  relevance_score: number | null;
  proposal_status: string | null;
  custom_proposal: string | null;
  /** Message d'erreur si la génération de proposition a échoué */
  proposal_error: string | null;
  analyzed_at: string | null;
  /** Données SEO fusionnées (LEFT JOIN) */
  seo_analysis: SEOAnalysisRow | null;
  /** Annonces LinkedIn liées (job_url, job_title) pour lien de vérification */
  job_offers: CompanyJobOffer[];
}

export type ProposalStatusFilter = "all" | "draft" | "sent" | "responded";
export type ScoreRangeFilter = "all" | "0-50" | "51-75" | "76-100";

export interface EnrichedCompaniesFilters {
  proposalStatus: ProposalStatusFilter;
  scoreRange: ScoreRangeFilter;
  searchQuery: string;
}

const DEFAULT_FILTERS: EnrichedCompaniesFilters = {
  proposalStatus: "all",
  scoreRange: "all",
  searchQuery: "",
};

function getScoreRange(score: number | null): "0-50" | "51-75" | "76-100" | null {
  if (score === null) return null;
  if (score <= 50) return "0-50";
  if (score <= 75) return "51-75";
  return "76-100";
}

export interface UseEnrichedCompaniesReturn {
  companies: EnrichedCompanyRow[];
  loading: boolean;
  error: string | null;
  filters: EnrichedCompaniesFilters;
  updateFilters: (partial: Partial<EnrichedCompaniesFilters>) => void;
  markAsSent: (companyId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEnrichedCompanies(
  territoryId: string | undefined,
  searchId?: string | null
): UseEnrichedCompaniesReturn {
  const [rows, setRows] = useState<EnrichedCompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EnrichedCompaniesFilters>(DEFAULT_FILTERS);

  const loadData = useCallback(async () => {
    if (!territoryId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let companyIdsFromSearch: string[] | null = null;
      if (searchId) {
        const { data: offers } = await supabase
          .from("linkedin_job_offers")
          .select("company_id")
          .eq("search_id", searchId);
        companyIdsFromSearch = [...new Set((offers ?? []).map((o: { company_id: string | null }) => o.company_id).filter(Boolean))] as string[];
        if (companyIdsFromSearch.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }
      }

      const selectColumns = "id, name, linkedin_url, website_url, seo_audit_id, company_analysis, relevance_score, proposal_status, custom_proposal, proposal_error, analyzed_at";
      const selectColumnsFallback = "id, name, linkedin_url, website_url, seo_audit_id, company_analysis, relevance_score, proposal_status, custom_proposal, analyzed_at";

      let query = supabase
        .from("linkedin_companies")
        .select(selectColumns)
        .eq("territory_id", territoryId)
        .not("website_url", "is", null)
        .or("seo_audit_id.not.is.null,company_analysis.not.is.null,custom_proposal.not.is.null");

      if (companyIdsFromSearch && companyIdsFromSearch.length > 0) {
        query = query.in("id", companyIdsFromSearch);
      }

      let { data: companiesData, error: companiesError } = await query.order("analyzed_at", { ascending: false });

      if (companiesError) {
        const errMsg = companiesError.message ?? "";
        if (errMsg.includes("proposal_error") || errMsg.includes("column") || errMsg.includes("does not exist")) {
          let queryFallback = supabase
            .from("linkedin_companies")
            .select(selectColumnsFallback)
            .eq("territory_id", territoryId)
            .not("website_url", "is", null)
            .or("seo_audit_id.not.is.null,company_analysis.not.is.null,custom_proposal.not.is.null");
          if (companyIdsFromSearch && companyIdsFromSearch.length > 0) {
            queryFallback = queryFallback.in("id", companyIdsFromSearch);
          }
          const res = await queryFallback.order("analyzed_at", { ascending: false });
          companiesError = res.error;
          companiesData = res.data;
        }
      }

      if (companiesError) throw companiesError;

      const companies = ((companiesData ?? []) as (EnrichedCompanyRow & { proposal_error?: string | null })[]).map((c) => ({
        ...c,
        proposal_error: c.proposal_error ?? null,
      })) as EnrichedCompanyRow[];
      const auditIds = companies.map((c) => c.seo_audit_id).filter(Boolean) as string[];

      let seoMap: Record<string, SEOAnalysisRow> = {};
      if (auditIds.length > 0) {
        const { data: seoData, error: seoError } = await supabase
          .from("seo_analyses")
          .select("id, seo_score, performance_score, accessibility_score, best_practices_score, full_report, website_url, meta_description, has_meta_description, title_tag, has_viewport, is_crawlable, created_at, analyzed_at, territory_id")
          .in("id", auditIds);

        if (!seoError && seoData) {
          (seoData as SEOAnalysisRow[]).forEach((s) => {
            seoMap[s.id] = s;
          });
        }
      }

      const companyIds = companies.map((c) => c.id);
      let jobOffersByCompany: Record<string, CompanyJobOffer[]> = {};
      if (companyIds.length > 0) {
        const { data: offersData } = await supabase
          .from("linkedin_job_offers")
          .select("company_id, job_url, job_title")
          .in("company_id", companyIds);
        const offersList = (offersData ?? []) as { company_id: string | null; job_url: string | null; job_title: string | null }[];
        const seenTitlesByCompany = new Map<string, Set<string>>();
        offersList.forEach((o) => {
          if (o.company_id && o.job_url) {
            if (!jobOffersByCompany[o.company_id]) {
              jobOffersByCompany[o.company_id] = [];
              seenTitlesByCompany.set(o.company_id, new Set());
            }
            const titleKey = (o.job_title ?? "").trim().toLowerCase() || o.job_url;
            const seen = seenTitlesByCompany.get(o.company_id)!;
            if (!seen.has(titleKey)) {
              seen.add(titleKey);
              jobOffersByCompany[o.company_id].push({
                job_url: o.job_url,
                job_title: o.job_title ?? null,
              });
            }
          }
        });
      }

      const merged: EnrichedCompanyRow[] = companies.map((c) => ({
        ...c,
        company_analysis: (c.company_analysis as CompanyAnalysisData | null) ?? null,
        seo_analysis: c.seo_audit_id ? seoMap[c.seo_audit_id] ?? null : null,
        job_offers: jobOffersByCompany[c.id] ?? [],
      }));

      setRows(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des entreprises enrichies.";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [territoryId, searchId]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const updateFilters = useCallback((partial: Partial<EnrichedCompaniesFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const markAsSent = useCallback(
    async (companyId: string) => {
      const { error: updateError } = await supabase
        .from("linkedin_companies")
        .update({ proposal_status: "sent", updated_at: new Date().toISOString() })
        .eq("id", companyId);

      if (updateError) {
        console.error("[useEnrichedCompanies] markAsSent", updateError);
        return;
      }
      setRows((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, proposal_status: "sent" } : c))
      );
    },
    []
  );

  const companies = useMemo(() => {
    let list = rows;

    if (filters.proposalStatus !== "all") {
      list = list.filter((c) => (c.proposal_status ?? "draft") === filters.proposalStatus);
    }

    if (filters.scoreRange !== "all") {
      list = list.filter((c) => {
        const score = c.seo_analysis?.seo_score ?? c.seo_analysis?.performance_score ?? null;
        const range = getScoreRange(score);
        return range === filters.scoreRange;
      });
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    return list;
  }, [rows, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { companies, loading, error, filters, updateFilters, markAsSent, refresh };
}
