import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SEOAnalysis } from "../components/SEOAnalysis";

// Call PageSpeed API directly from browser (no Edge Function)
async function analyzeSEOFromBrowser(url: string) {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error("URL invalide");
  }

  const apiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
  const params = new URLSearchParams();
  params.append("url", url);
  params.append("key", "AIzaSyDFn_Ya740o9-AYO7HCcsEPzy9LUBzOXbk");
  params.append("category", "SEO");
  params.append("category", "PERFORMANCE");
  params.append("category", "ACCESSIBILITY");
  params.append("category", "BEST_PRACTICES");
  params.append("strategy", "mobile");

  const response = await fetch(`${apiUrl}?${params}`);

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
    throw new Error(data.error.message || "Erreur lors de l'analyse");
  }

  const lighthouse = data.lighthouseResult;

  return {
    websiteUrl: url,
    seoScore: Math.round((lighthouse?.categories?.seo?.score || 0) * 100),
    performanceScore: Math.round((lighthouse?.categories?.performance?.score || 0) * 100),
    accessibilityScore: Math.round((lighthouse?.categories?.accessibility?.score || 0) * 100),
    bestPracticesScore: Math.round((lighthouse?.categories?.["best-practices"]?.score || 0) * 100),
    metaDescription: lighthouse?.audits?.["meta-description"]?.description || null,
    hasMetaDescription: (lighthouse?.audits?.["meta-description"]?.score || 0) >= 0.5,
    titleTag: lighthouse?.audits?.["document-title"]?.displayValue || "",
    hasViewport: (lighthouse?.audits?.viewport?.score || 0) >= 0.5,
    isCrawlable: (lighthouse?.audits?.["is-crawlable"]?.score || 0) >= 0.5,
    fullReport: lighthouse || {},
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

      // Save to Supabase
      const { data: savedAnalysis, error: saveError } = await supabase
        .from("seo_analyses")
        .insert({
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
          analyzed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) throw saveError;

      const newAnalysis = savedAnalysis as SEOAnalysis;

      setAnalyses((prev) => [newAnalysis, ...prev]);
      setSelectedAnalysis(newAnalysis);

      toast({
        title: "Analyse terminée",
        description: `Score SEO: ${newAnalysis.seo_score}/100`,
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
