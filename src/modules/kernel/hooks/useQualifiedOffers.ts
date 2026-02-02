/**
 * Hook : chargement des offres qualifiées (analysis_result.isRelevant = true) avec données entreprise.
 * Filtre isRelevant, tri par confidence DESC, merge des données entreprise.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisResult {
  isRelevant?: boolean;
  confidence?: number;
  matchedThemes?: string[];
  detectedConcepts?: string[];
  reason?: string;
}

export interface LinkedInCompanyRow {
  id: string;
  name: string;
  linkedin_url: string | null;
  website_url: string | null;
  seo_audit_id: string | null;
  company_analysis: Record<string, unknown> | null;
  relevance_score: number | null;
  proposal_status: string | null;
  custom_proposal: string | null;
  proposal_error: string | null;
  analyzed_at: string | null;
}

export interface QualifiedOfferRow {
  id: string;
  search_id: string;
  company_id: string | null;
  company_name: string;
  company_linkedin_url: string | null;
  job_title: string;
  job_url: string | null;
  job_location: string | null;
  job_description: string | null;
  analysis_result: AnalysisResult | null;
  linkedin_companies: LinkedInCompanyRow | null;
}

const PAGE_SIZE = 20;
const MAX_OFFERS = 100;

export interface UseQualifiedOffersReturn {
  offers: QualifiedOfferRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
}

export function useQualifiedOffers(territoryId: string | undefined, searchId?: string | null): UseQualifiedOffersReturn {
  const [allOffers, setAllOffers] = useState<QualifiedOfferRow[]>([]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offers = allOffers.slice(0, displayCount);
  const hasMore = displayCount < allOffers.length;

  const loadData = useCallback(async () => {
    if (!territoryId) {
      setAllOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let searchIds: string[];

      if (searchId) {
        searchIds = [searchId];
      } else {
        const { data: searches } = await supabase
          .from("linkedin_job_searches")
          .select("id")
          .eq("territory_id", territoryId);
        searchIds = (searches ?? []).map((s: { id: string }) => s.id);
      }

      if (searchIds.length === 0) {
        setAllOffers([]);
        setLoading(false);
        return;
      }

      const { data: offersData, error: offersError } = await supabase
        .from("linkedin_job_offers")
        .select("id, search_id, company_id, company_name, company_linkedin_url, job_title, job_url, job_location, job_description, analysis_result")
        .in("search_id", searchIds)
        .limit(MAX_OFFERS * 2);

      if (offersError) throw offersError;

      const rows = (offersData ?? []) as (QualifiedOfferRow & { linkedin_companies?: LinkedInCompanyRow | null })[];
      const qualified = rows.filter((r) => r.analysis_result?.isRelevant === true);
      qualified.sort((a, b) => (b.analysis_result?.confidence ?? 0) - (a.analysis_result?.confidence ?? 0));
      const limited = qualified.slice(0, MAX_OFFERS);

      const companyIds = [...new Set(limited.map((o) => o.company_id).filter(Boolean))] as string[];

      let companiesMap: Record<string, LinkedInCompanyRow> = {};
      if (companyIds.length > 0) {
        const cols = "id, name, linkedin_url, website_url, seo_audit_id, company_analysis, relevance_score, proposal_status, custom_proposal, proposal_error, analyzed_at";
        const colsFallback = "id, name, linkedin_url, website_url, seo_audit_id, company_analysis, relevance_score, proposal_status, custom_proposal, analyzed_at";
        let { data: companiesData, error: companiesError } = await supabase
          .from("linkedin_companies")
          .select(cols)
          .in("id", companyIds);

        if (companiesError) {
          const errMsg = companiesError.message ?? "";
          if (errMsg.includes("proposal_error") || errMsg.includes("column") || errMsg.includes("does not exist")) {
            const res = await supabase.from("linkedin_companies").select(colsFallback).in("id", companyIds);
            companiesError = res.error;
            companiesData = res.data;
          }
        }

        if (!companiesError && companiesData) {
          (companiesData as (LinkedInCompanyRow & { proposal_error?: string | null })[]).forEach((c) => {
            companiesMap[c.id] = { ...c, proposal_error: c.proposal_error ?? null };
          });
        }
      }

      const withCompanies: QualifiedOfferRow[] = limited.map((o) => ({
        ...o,
        linkedin_companies: o.company_id ? companiesMap[o.company_id] ?? null : null,
      }));

      setAllOffers(withCompanies);
      setDisplayCount(PAGE_SIZE);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des offres.";
      setError(message);
      setAllOffers([]);
    } finally {
      setLoading(false);
    }
  }, [territoryId, searchId]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, allOffers.length));
  }, [allOffers.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { offers, loading, error, refresh, loadMore, hasMore };
}
