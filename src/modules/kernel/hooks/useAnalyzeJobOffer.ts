/**
 * Hook : analyse IA d'une offre LinkedIn via la Edge Function analyze-job-offer.
 * Gère loading, error, success et retourne un résultat typé JobOfferAnalysisResult.
 */

import { useState, useCallback } from "react";
import { analyzeJobOffer } from "@/lib/linkedin-prospection";
import type {
  JobOfferAnalysisResult,
  AnalyzeJobOfferInput,
} from "@/lib/linkedin-prospection";

export interface UseAnalyzeJobOfferReturn {
  /** Lance l'analyse avec la description et les thèmes fournis */
  analyze: (input: AnalyzeJobOfferInput) => Promise<void>;
  /** Analyse en cours */
  loading: boolean;
  /** Message d'erreur (réseau, OpenAI, validation) ou null */
  error: string | null;
  /** Résultat de la dernière analyse réussie, ou null */
  result: JobOfferAnalysisResult | null;
  /** Réinitialise l'état (erreur et résultat) */
  reset: () => void;
}

export function useAnalyzeJobOffer(): UseAnalyzeJobOfferReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobOfferAnalysisResult | null>(null);

  const analyze = useCallback(async (input: AnalyzeJobOfferInput) => {
    console.log("[useAnalyzeJobOffer] analyse() appelée", {
      descriptionLength: input.jobDescription?.length ?? 0,
      themesCount: input.themes?.length ?? 0,
      themes: input.themes,
    });

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeJobOffer(input);

      if (response.success) {
        console.log("[useAnalyzeJobOffer] Succès", {
          isRelevant: response.data.isRelevant,
          confidence: response.data.confidence,
          matchedThemes: response.data.matchedThemes,
          detectedConceptsCount: response.data.detectedConcepts?.length ?? 0,
        });
        setResult(response.data);
      } else {
        console.warn("[useAnalyzeJobOffer] Erreur retournée", {
          error: response.error,
        });
        setError(response.error);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inattendue lors de l'analyse.";
      console.error("[useAnalyzeJobOffer] Exception", err);
      setError(message);
    } finally {
      setLoading(false);
      console.log("[useAnalyzeJobOffer] analyse() terminée, loading=false");
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    console.log("[useAnalyzeJobOffer] reset()");
  }, []);

  return { analyze, loading, error, result, reset };
}
