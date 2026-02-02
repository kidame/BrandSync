/**
 * Hook : recherche intelligente LinkedIn (scraping Apify + process-linkedin-offers).
 * Gère les états idle, scraping, processing, success, error et les stats de traitement.
 */

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apifyApi } from "@/lib/api";

const LINKEDIN_JOBS_BASE = "https://www.linkedin.com/jobs/search/";
const POLL_INTERVAL_MS = 8000;

const GENERIC_EDGE_ERROR = "Edge Function returned a non-2xx status code";
const EDGE_ERROR_HINT =
  "Vérifiez les secrets Supabase (Dashboard → Project Settings → Edge Functions → Secrets) : APIFY_API_KEY (scraping), OPENAI_API_KEY et PAGESPEED_API_KEY (analyse). Consultez les logs des Edge Functions pour le détail.";
const AUTH_401_HINT =
  "En cas de 401 (Unauthorized) : la fonction doit avoir verify_jwt = false dans supabase/config.toml ; redéployez avec : npx supabase functions deploy process-linkedin-offers.";

export type IntelligentSearchState = "idle" | "scraping" | "processing" | "success" | "error";

export interface ProcessLinkedInOffersStats {
  total_offers: number;
  analyzed_offers: number;
  relevant_offers: number;
  enriched_companies: number;
  proposals_generated: number;
  errors: number;
  processing_time_seconds: number;
}

export interface UseIntelligentSearchReturn {
  state: IntelligentSearchState;
  error: string | null;
  stats: ProcessLinkedInOffersStats | null;
  /** Avertissement si aucune offre n'a pu être analysée (0 analysées) */
  warning: string | null;
  /** ID de la recherche qui vient de se terminer (pour auto-sélection dans la liste) */
  lastSearchId: string | null;
  launchSearch: (params: {
    themes: string[];
    searchType: "keywords" | "url";
    keywords?: string;
    location?: string;
    searchUrl?: string;
    count: number;
  }) => Promise<void>;
  /** Annule une recherche en cours (scraping ou analyse). */
  cancelSearch: () => void;
  reset: () => void;
}

function parseThemes(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildSearchUrl(searchType: "keywords" | "url", keywords?: string, location?: string, searchUrl?: string): string {
  if (searchType === "url" && searchUrl?.trim()) {
    return searchUrl.trim();
  }
  const params = new URLSearchParams();
  if (keywords?.trim()) params.set("keywords", keywords.trim());
  if (location?.trim()) params.set("location", location.trim());
  return params.toString() ? `${LINKEDIN_JOBS_BASE}?${params.toString()}` : LINKEDIN_JOBS_BASE;
}

export function useIntelligentSearch(territoryId: string): UseIntelligentSearchReturn {
  const [state, setState] = useState<IntelligentSearchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcessLinkedInOffersStats | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastSearchId, setLastSearchId] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const cancelSearch = useCallback(() => {
    cancelRef.current = true;
    setState("idle");
    setError(null);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:cancelSearch",message:"cancel",data:{},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H4"})}).catch(()=>{});
    // #endregion
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = false;
    setState("idle");
    setError(null);
    setStats(null);
    setWarning(null);
    setLastSearchId(null);
  }, []);

  const launchSearch = useCallback(
    async (params: {
      themes: string[];
      searchType: "keywords" | "url";
      keywords?: string;
      location?: string;
      searchUrl?: string;
      count: number;
    }) => {
      const { themes, searchType, keywords, location, searchUrl, count } = params;

      if (!themes.length) {
        setError("Définissez au moins un thème à détecter.");
        setState("error");
        return;
      }

      const url = buildSearchUrl(searchType, keywords, location, searchUrl);
      if (!url.startsWith("http")) {
        setError("Indiquez des mots-clés ou une URL LinkedIn valide.");
        setState("error");
        return;
      }

      if (searchType === "keywords" && !keywords?.trim()) {
        setError("Indiquez des mots-clés pour la recherche.");
        setState("error");
        return;
      }

      if (searchType === "url" && !searchUrl?.trim()) {
        setError("Collez l'URL de votre recherche LinkedIn.");
        setState("error");
        return;
      }

      setError(null);
      setStats(null);
      setWarning(null);
      setState("scraping");
      cancelRef.current = false;
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:launchSearch",message:"state=scraping",data:{themesLen:themes.length,searchType,count},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H1"})}).catch(()=>{});
      // #endregion

      /** Pour indiquer quelle étape a échoué (quelle clé vérifier) */
      let failedPhase: "scraping" | "processing" = "scraping";

      try {
        const { data: searchRecord, error: searchError } = await supabase
          .from("linkedin_job_searches")
          .insert({
            territory_id: territoryId,
            search_keywords: searchType === "url" ? "URL personnalisée" : (keywords?.trim() ?? "—"),
            location: searchType === "url" ? "" : (location?.trim() ?? ""),
            search_url: url,
            status: "pending",
            analysis_themes: themes,
          })
          .select("id")
          .single();

        if (searchError || !searchRecord?.id) {
          throw new Error(searchError?.message ?? "Création de la recherche échouée.");
        }

        const searchId = searchRecord.id;
        setLastSearchId(searchId);
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:afterInsert",message:"searchId",data:{searchId},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H5"})}).catch(()=>{});
        // #endregion
        const result = await apifyApi.scrapeLinkedInJobs(territoryId, url, {
          linkedinSearchId: searchId,
          count: Math.max(100, Math.min(1000, count)),
        });
        const maxOffersToProcess = Math.max(1, Math.min(1000, count));

        if (!result.success) {
          throw new Error(result.error ?? "Échec du lancement du scraping.");
        }

        const jobId = result.data?.job_id as string | undefined;
        const apifyRunId = result.data?.apify_run_id as string | undefined;

        if (!jobId || !apifyRunId) {
          throw new Error("Réponse Apify invalide (job_id ou apify_run_id manquant).");
        }
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:apifyStarted",message:"polling start",data:{jobId:!!jobId,apifyRunId:!!apifyRunId},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H1"})}).catch(()=>{});
        // #endregion

        let pollCount = 0;
        while (true) {
          if (cancelRef.current) {
            setState("idle");
            return;
          }
          const res = await apifyApi.getResults(jobId, apifyRunId);
          if (!res.success) {
            throw new Error(res.error ?? "Erreur lors de la récupération des résultats.");
          }
          const status = res.data?.status as string | undefined;
          pollCount++;
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:poll",message:"poll iteration",data:{pollCount,status},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H1"})}).catch(()=>{});
          // #endregion
          if (status === "completed") {
            break;
          }
          if (status === "failed") {
            throw new Error("Le scraping Apify a échoué.");
          }
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }

        setState("processing");
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:processing",message:"state=processing",data:{pollCount},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H2"})}).catch(()=>{});
        // #endregion
        failedPhase = "processing";

        const maxDurationMs = 100 * 1000;
        let lastPayload: { success?: boolean; stats?: ProcessLinkedInOffersStats; error?: string; warning?: string; has_more?: boolean } | null = null;
        let processCallCount = 0;
        const accumulatedStats: ProcessLinkedInOffersStats = {
          total_offers: 0,
          analyzed_offers: 0,
          relevant_offers: 0,
          enriched_companies: 0,
          proposals_generated: 0,
          errors: 0,
          processing_time_seconds: 0,
        };

        do {
          if (cancelRef.current) {
            setState("idle");
            return;
          }
          processCallCount++;
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:doWhile",message:"process invoke",data:{processCallCount,lastHasMore:!!lastPayload?.has_more},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H2"})}).catch(()=>{});
          // #endregion
          const { data: processData, error: processError } = await supabase.functions.invoke("process-linkedin-offers", {
            body: { search_id: searchId, max_duration_ms: maxDurationMs, max_offers_to_process: maxOffersToProcess },
          });

          const processPayload = processData as typeof lastPayload;
          lastPayload = processPayload;

          if (processError) {
            const msg =
              processError.message === GENERIC_EDGE_ERROR
                ? `${GENERIC_EDGE_ERROR}. ${EDGE_ERROR_HINT}`
                : processPayload?.error ?? processError.message ?? "Échec du traitement des offres.";
            throw new Error(msg);
          }
          if (!processPayload?.success) {
            throw new Error(processPayload?.error ?? "Le traitement des offres a échoué.");
          }

          const s = processPayload.stats;
          if (s) {
            accumulatedStats.total_offers = s.total_offers;
            accumulatedStats.analyzed_offers += s.analyzed_offers;
            accumulatedStats.relevant_offers += s.relevant_offers;
            accumulatedStats.enriched_companies += s.enriched_companies;
            accumulatedStats.proposals_generated += s.proposals_generated;
            accumulatedStats.errors += s.errors;
            accumulatedStats.processing_time_seconds += s.processing_time_seconds ?? 0;
          }
          setStats({ ...accumulatedStats });
          setWarning(processPayload.warning ?? null);

          if (processPayload.has_more) {
            await new Promise((r) => setTimeout(r, 1500));
            if (cancelRef.current) {
              setState("idle");
              return;
            }
          }
        } while (lastPayload?.has_more === true);

        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:success",message:"state=success",data:{lastSearchId:searchId,processCallCount},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H2,H3"})}).catch(()=>{});
        // #endregion
        setState("success");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Une erreur est survenue.";
        const isEdgeNon2xx =
          message === GENERIC_EDGE_ERROR || message.includes("Invalid JWT") || message.includes("non-2xx");

        if (failedPhase === "processing" && isEdgeNon2xx) {
          const { count } = await supabase
            .from("linkedin_job_offers")
            .select("id", { count: "exact", head: true })
            .eq("search_id", searchId);
          if (count != null && count > 0) {
            setWarning(
              "La réponse du serveur a expiré (timeout) ou une erreur s'est produite en fin de traitement, mais des résultats ont bien été enregistrés. Consultez les onglets ci-dessous."
            );
            setError(null);
            setState("success");
            return;
          }
        }

        let displayMessage = message;
        const phaseHint =
          failedPhase === "scraping"
            ? "→ Clé à vérifier : APIFY_API_KEY (Secrets Supabase)."
            : "→ Clés à vérifier : OPENAI_API_KEY et PAGESPEED_API_KEY (Secrets Supabase).";
        if (isEdgeNon2xx) {
          displayMessage = message.includes("Invalid JWT")
            ? "Clé d'authentification invalide. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env."
            : `${message}\n\n${phaseHint}\n\n${EDGE_ERROR_HINT}\n\n${AUTH_401_HINT}`;
        } else {
          displayMessage = `${message}\n\n${phaseHint}`;
        }
        setError(displayMessage);
        setState("error");
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"useIntelligentSearch.ts:catch",message:"state=error",data:{failedPhase,messageLen:message?.length},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H5"})}).catch(()=>{});
        // #endregion
      }
    },
    [territoryId]
  );

  return { state, error, stats, warning, lastSearchId, launchSearch, cancelSearch, reset };
}

export { parseThemes };
