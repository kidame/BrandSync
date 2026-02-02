import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  AnalyzeSEOComparisonPayload,
  AnalyzeSEOComparisonResponse,
} from "../types/seoReport";

export function useAIComparison() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical" | null>(null);
  const [keyIssues, setKeyIssues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = useCallback(async (data: AnalyzeSEOComparisonPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: response, error: invokeError } = await supabase.functions.invoke(
        "analyze-seo-comparison",
        { body: data }
      );

      if (invokeError) throw invokeError;

      const result = response as AnalyzeSEOComparisonResponse;
      if (!result?.success && result?.error) {
        throw new Error(result.error);
      }
      if (!result?.success) {
        throw new Error("Échec de l'analyse IA");
      }

      setAnalysis(result.analysis ?? null);
      setPriority(result.priority ?? undefined);
      setKeyIssues(result.key_issues ?? []);
      return result;
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : "Erreur lors de la génération";

      // Si la plateforme renvoie un non-2xx, essayer de lire le corps (notre fonction peut y mettre { success: false, error: "..." })
      if (err && typeof err === "object" && (err as { name?: string }).name === "FunctionsHttpError") {
        const res = (err as { context?: Response }).context;
        if (res && typeof (res as Response).json === "function") {
          try {
            const body = await (res as Response).json() as { success?: boolean; error?: string };
            if (typeof body?.error === "string") {
              message = body.error;
            }
          } catch {
            // ignorer si le corps n'est pas du JSON
          }
        }
        if (message === "Edge Function returned a non-2xx status code") {
          message =
            "L'Edge Function a renvoyé une erreur. Redéployez avec : npx supabase functions deploy analyze-seo-comparison. Vérifiez aussi OPENAI_API_KEY dans Supabase (Edge Functions → Secrets).";
        }
      } else if (
        typeof message === "string" &&
        (message.includes("Failed to send") || message.includes("fetch") || message.includes("Network"))
      ) {
        message =
          "Impossible de joindre l'Edge Function. Déployez-la avec : npx supabase functions deploy analyze-seo-comparison. Puis configurez OPENAI_API_KEY dans Supabase (Edge Functions → Secrets).";
      }
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setPriority(null);
    setKeyIssues([]);
    setError(null);
  }, []);

  return { analysis, priority, keyIssues, isLoading, error, generateAnalysis, reset };
}
