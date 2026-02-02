import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SEOAnalysis } from "../components/SEOAnalysis";
import type { DesktopScores } from "../components/SEOAnalysis/SEOAnalysisResults";
import { extractLighthouseExtended } from "./extractLighthouseExtended";

const PAGE_SPEED_API =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const API_KEY = "AIzaSyDFn_Ya740o9-AYO7HCcsEPzy9LUBzOXbk";

type Strategy = "mobile" | "desktop";

/** Appel unique PageSpeed Insights (mobile ou desktop). */
async function runPagespeed(
  url: string,
  strategy: Strategy
): Promise<{ lighthouseResult: Record<string, unknown> }> {
  const params = new URLSearchParams();
  params.set("url", url);
  params.set("key", API_KEY);
  params.set("strategy", strategy);
  params.append("category", "SEO");
  params.append("category", "PERFORMANCE");
  params.append("category", "ACCESSIBILITY");
  params.append("category", "BEST_PRACTICES");
  const response = await fetch(`${PAGE_SPEED_API}?${params}`);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Trop de requêtes. Veuillez réessayer dans quelques minutes.");
    }
    if (response.status === 400) {
      throw new Error("URL invalide ou inaccessible pour l'analyse.");
    }
    throw new Error("Erreur lors de l'analyse SEO");
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error?.message || "Erreur lors de l'analyse");
  }
  return { lighthouseResult: data.lighthouseResult || {} };
}

/** Scores depuis lighthouseResult.categories. */
function getScoresFromLighthouse(lighthouse: Record<string, unknown>): {
  seo: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
} {
  const cat = (lighthouse?.categories as Record<string, { score?: number }>) || {};
  return {
    seo: Math.round((cat.seo?.score ?? 0) * 100),
    performance: Math.round((cat.performance?.score ?? 0) * 100),
    accessibility: Math.round((cat.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((cat["best-practices"]?.score ?? 0) * 100),
  };
}

/** Analyse mobile + desktop en parallèle, extraction des données étendues. */
async function analyzeSEOFromBrowser(url: string): Promise<{
  websiteUrl: string;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  metaDescription: string | null;
  hasMetaDescription: boolean;
  titleTag: string;
  hasViewport: boolean;
  isCrawlable: boolean;
  fullReport: Record<string, unknown>;
  desktopScores: DesktopScores | null;
  fullReportDesktop: Record<string, unknown> | null;
  extended: ReturnType<typeof extractLighthouseExtended>;
}> {
  try {
    new URL(url);
  } catch {
    throw new Error("URL invalide");
  }

  const [mobileRes, desktopRes] = await Promise.all([
    runPagespeed(url, "mobile"),
    runPagespeed(url, "desktop"),
  ]);

  const lighthouse = mobileRes.lighthouseResult as Record<string, unknown>;
  const audits = (lighthouse?.audits as Record<string, unknown>) || {};
  const metaDescAudit = audits["meta-description"] as { score?: number; description?: string } | undefined;
  const titleAudit = audits["document-title"] as { displayValue?: string } | undefined;
  const viewportAudit = audits.viewport as { score?: number } | undefined;
  const crawlableAudit = audits["is-crawlable"] as { score?: number } | undefined;

  const mobileScores = getScoresFromLighthouse(lighthouse);
  const desktopScores: DesktopScores | null = desktopRes.lighthouseResult
    ? getScoresFromLighthouse(desktopRes.lighthouseResult as Record<string, unknown>)
    : null;
  const fullReportDesktop = desktopRes.lighthouseResult
    ? (desktopRes.lighthouseResult as Record<string, unknown>)
    : null;

  const extended = extractLighthouseExtended(lighthouse);

  return {
    websiteUrl: url,
    seoScore: mobileScores.seo,
    performanceScore: mobileScores.performance,
    accessibilityScore: mobileScores.accessibility,
    bestPracticesScore: mobileScores.bestPractices,
    metaDescription: metaDescAudit?.description ?? null,
    hasMetaDescription: (metaDescAudit?.score ?? 0) >= 0.5,
    titleTag: titleAudit?.displayValue ?? "",
    hasViewport: (viewportAudit?.score ?? 0) >= 0.5,
    isCrawlable: (crawlableAudit?.score ?? 0) >= 0.5,
    fullReport: lighthouse,
    desktopScores,
    fullReportDesktop,
    extended,
  };
}

export function useSEOAnalysis(territoryId: string | undefined) {
  const [analyses, setAnalyses] = useState<SEOAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SEOAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  // Load history of analyses for this territory
  const loadHistory = useCallback(async () => {
    if (!territoryId) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("seo_analyses")
        .select("*")
        .eq("territory_id", territoryId)
        .order("analyzed_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const typedData = (data || []) as SEOAnalysis[];
      setAnalyses(typedData);

      if (typedData.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(typedData[0]);
      }
    } catch (error) {
      console.error("Error loading SEO history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [territoryId, selectedAnalysis]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Analyze a new URL (calls PageSpeed API directly from browser)
  const analyzeUrl = async (websiteUrl: string) => {
    if (!territoryId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un projet",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call PageSpeed API from browser
      const result = await analyzeSEOFromBrowser(websiteUrl);

      const analyzedAt = new Date().toISOString();
      const insertPayload: Record<string, unknown> = {
        territory_id: territoryId,
        website_url: result.websiteUrl,
        seo_score: result.seoScore,
        performance_score: result.performanceScore,
        accessibility_score: result.accessibilityScore,
        best_practices_score: result.bestPracticesScore,
        meta_description: result.metaDescription,
        has_meta_description: result.hasMetaDescription,
        title_tag: result.titleTag,
        has_viewport: result.hasViewport,
        is_crawlable: result.isCrawlable,
        full_report: result.fullReport,
        analyzed_at: analyzedAt,
      };
      if (result.desktopScores) {
        insertPayload.desktop_scores = result.desktopScores;
        insertPayload.full_report_desktop = result.fullReportDesktop;
      }
      insertPayload.images_without_alt = result.extended.images_without_alt;
      insertPayload.links_without_text = result.extended.links_without_text;
      insertPayload.render_blocking_resources = result.extended.render_blocking_resources;
      insertPayload.unused_javascript = result.extended.unused_javascript;
      insertPayload.unused_css = result.extended.unused_css;
      insertPayload.page_size_bytes = result.extended.page_size_bytes;
      insertPayload.request_count = result.extended.request_count;
      insertPayload.has_sitemap = result.extended.has_sitemap;
      insertPayload.has_robots_txt = result.extended.has_robots_txt;
      insertPayload.has_structured_data = result.extended.has_structured_data;
      insertPayload.structured_data_types = result.extended.structured_data_types;
      insertPayload.open_graph_tags = result.extended.open_graph_tags;
      insertPayload.h1_tags = result.extended.h1_tags;
      insertPayload.h2_tags = result.extended.h2_tags;
      insertPayload.h3_tags = result.extended.h3_tags;
      insertPayload.color_contrast_issues = result.extended.color_contrast_issues;

      const { data: savedAnalysis, error: saveError } = await supabase
        .from("seo_analyses")
        .insert(insertPayload)
        .select("*")
        .single();

      if (saveError) throw saveError;

      const newAnalysis = savedAnalysis as SEOAnalysis;
      const analysisWithDesktop: SEOAnalysis = {
        ...newAnalysis,
        desktop_scores: newAnalysis.desktop_scores ?? result.desktopScores ?? null,
        full_report_desktop: newAnalysis.full_report_desktop ?? result.fullReportDesktop ?? null,
      };

      setAnalyses((prev) => [analysisWithDesktop, ...prev]);
      setSelectedAnalysis(analysisWithDesktop);

      toast({
        title: "Analyse terminée",
        description: analysisWithDesktop.desktop_scores
          ? `Mobile & Desktop analysés. Score SEO: ${analysisWithDesktop.seo_score}/100 (mobile). Utilisez la vue « Vue » pour basculer.`
          : `Score SEO: ${analysisWithDesktop.seo_score}/100`,
      });
    } catch (error) {
      console.error("SEO analysis error:", error);
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an analysis
  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase.from("seo_analyses").delete().eq("id", id);

      if (error) throw error;

      setAnalyses((prev) => prev.filter((a) => a.id !== id));

      if (selectedAnalysis?.id === id) {
        const remaining = analyses.filter((a) => a.id !== id);
        setSelectedAnalysis(remaining.length > 0 ? remaining[0] : null);
      }

      toast({
        title: "Analyse supprimée",
        description: "L'analyse a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'analyse",
        variant: "destructive",
      });
    }
  };

  return {
    analyses,
    selectedAnalysis,
    setSelectedAnalysis,
    isLoading,
    isLoadingHistory,
    analyzeUrl,
    deleteAnalysis,
    refreshHistory: loadHistory,
  };
}
