/**
 * Edge Function : orchestration du workflow prospection LinkedIn.
 * Pour une recherche (search_id) : analyse des offres, enrichissement entreprises, génération de propositions.
 * Appelle analyze-job-offer, extract-company-website, trigger-seo-audit, analyze-company-activity, generate-commercial-proposal.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 5;
const GLOBAL_TIMEOUT_MS = 5 * 60 * 1000;
/** Durée max par invocation pour rester sous le timeout plateforme (~150s). Le frontend rappellera si has_more. */
const DEFAULT_MAX_DURATION_MS = 100 * 1000;
const FUNCTION_CALL_TIMEOUT_MS = 30 * 1000;

interface ProcessLinkedInOffersRequest {
  search_id: string;
  /** Optionnel : durée max en ms par appel (défaut 100s). Si dépassé, retour avec has_more: true. */
  max_duration_ms?: number;
  /** Optionnel : ne traiter que les N premières offres (ex: 1 pour un test rapide). L'acteur Apify impose min 100 au scraping. */
  max_offers_to_process?: number;
}

interface ProcessLinkedInOffersSuccess {
  success: true;
  stats: {
    total_offers: number;
    analyzed_offers: number;
    relevant_offers: number;
    enriched_companies: number;
    proposals_generated: number;
    errors: number;
    processing_time_seconds: number;
  };
  /** true si d'autres offres restent à traiter ; le client doit rappeler avec le même search_id. */
  has_more?: boolean;
  /** Message d'avertissement si aucune offre n'a pu être analysée (ex: OPENAI manquant, descriptions vides) */
  warning?: string;
}

interface ProcessLinkedInOffersError {
  success: false;
  error: string;
}

interface JobOfferRow {
  id: string;
  search_id: string;
  company_id: string | null;
  company_name: string;
  company_linkedin_url: string | null;
  job_title: string;
  job_description: string | null;
  job_url: string | null;
  job_location: string | null;
  analysis_result: Record<string, unknown> | null;
}

interface SearchRow {
  id: string;
  territory_id: string;
  analysis_themes: string[] | null;
}

function jsonResponse(
  body: ProcessLinkedInOffersSuccess | ProcessLinkedInOffersError,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCompanyName(s: string | null | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}
function normalizeLinkedInUrl(s: string | null | undefined): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t || null;
}

/**
 * Invoque une Edge Function du projet avec timeout.
 */
async function invokeFunction(
  baseUrl: string,
  serviceRoleKey: string,
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs: number = FUNCTION_CALL_TIMEOUT_MS
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${baseUrl}/functions/v1/${functionName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) {
      const errMsg = (data?.error ?? data?.message ?? res.statusText) as string;
      return { ok: false, error: errMsg };
    }
    return { ok: true, data };
  } catch (e) {
    clearTimeout(timeoutId);
    const msg = e instanceof Error ? e.message : "Timeout ou erreur réseau";
    return { ok: false, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
  const hasPageSpeed = !!Deno.env.get("PAGESPEED_API_KEY");
  console.log("[process-linkedin-offers] Démarrage. OPENAI_API_KEY présent:", hasOpenAI, "| PAGESPEED_API_KEY présent:", hasPageSpeed);
  console.log("[process-linkedin-offers] Requête reçue", req.method);

  if (!hasOpenAI || !hasPageSpeed) {
    const missing: string[] = [];
    if (!hasOpenAI) missing.push("OPENAI_API_KEY");
    if (!hasPageSpeed) missing.push("PAGESPEED_API_KEY");
    const msg = `Secrets Supabase manquants : ${missing.join(", ")}. Définissez-les dans Dashboard → Project Settings → Edge Functions → Secrets.`;
    console.error("[process-linkedin-offers]", msg);
    return jsonResponse(
      { success: false, error: msg },
      200
    );
  }

  const startTime = Date.now();
  const stats = {
    total_offers: 0,
    analyzed_offers: 0,
    relevant_offers: 0,
    enriched_companies: 0,
    proposals_generated: 0,
    errors: 0,
  };

  try {
    let body: ProcessLinkedInOffersRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[process-linkedin-offers] Body JSON invalide");
      return jsonResponse(
        { success: false, error: "Body JSON invalide (search_id requis)." },
        200
      );
    }

    const searchId = typeof body.search_id === "string" ? body.search_id.trim() : "";
    if (!searchId) {
      return jsonResponse(
        { success: false, error: "search_id est requis." },
        200
      );
    }
    const maxDurationMs =
      typeof body.max_duration_ms === "number" && body.max_duration_ms > 0
        ? Math.min(body.max_duration_ms, GLOBAL_TIMEOUT_MS)
        : DEFAULT_MAX_DURATION_MS;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: searchRow, error: searchError } = await supabase
      .from("linkedin_job_searches")
      .select("id, territory_id, analysis_themes")
      .eq("id", searchId)
      .maybeSingle();

    if (searchError || !searchRow) {
      console.error("[process-linkedin-offers] Recherche inexistante ou erreur", searchError);
      return jsonResponse(
        { success: false, error: "Recherche inexistante ou search_id invalide." },
        200
      );
    }

    const territoryId = (searchRow as SearchRow).territory_id;
    let themes: string[] = [];
    const rawThemes = (searchRow as SearchRow).analysis_themes;
    if (Array.isArray(rawThemes)) {
      themes = rawThemes.map((t) => String(t).trim()).filter(Boolean);
    } else if (rawThemes && typeof rawThemes === "object") {
      themes = Object.values(rawThemes).map((t) => String(t).trim()).filter(Boolean);
    }

    if (themes.length === 0) {
      console.warn("[process-linkedin-offers] Aucun analysis_themes, utilisation d'un thème par défaut");
      themes = ["marketing", "digital", "SEO", "contenu"];
    }

    const { data: offers, error: offersError } = await supabase
      .from("linkedin_job_offers")
      .select("id, company_id, company_name, company_linkedin_url, job_title, job_description, job_url, job_location, analysis_result")
      .eq("search_id", searchId)
      .order("created_at", { ascending: true });

    if (offersError) {
      console.error("[process-linkedin-offers] Erreur chargement offres", offersError);
      return jsonResponse(
        { success: false, error: "Impossible de charger les offres." },
        200
      );
    }

    const EXCLUDED_COMPANY_NAMES = ["jobgether"];
    const rawList = (offers ?? []) as JobOfferRow[];
    const offerList = rawList.filter(
      (o) => !EXCLUDED_COMPANY_NAMES.includes((o.company_name ?? "").trim().toLowerCase())
    );
    const excludedCount = rawList.length - offerList.length;
    if (excludedCount > 0) {
      console.log("[process-linkedin-offers] Offres exclues (entreprise ignorée):", excludedCount);
    }

    const maxToProcess =
      typeof body.max_offers_to_process === "number" && body.max_offers_to_process > 0
        ? body.max_offers_to_process
        : null;
    if (maxToProcess != null && offerList.length > maxToProcess) {
      console.log("[process-linkedin-offers] Limitation à", maxToProcess, "offres (max_offers_to_process)");
      offerList.splice(maxToProcess);
    }
    stats.total_offers = offerList.length;

    if (offerList.length === 0) {
      return jsonResponse(
        { success: false, error: "Aucune offre liée à cette recherche." },
        200
      );
    }

    console.log("[process-linkedin-offers] Démarrage traitement", {
      search_id: searchId,
      total_offers: offerList.length,
      themes_count: themes.length,
      max_duration_ms: maxDurationMs,
    });

    const processOneOffer = async (
      offer: JobOfferRow,
      index: number
    ): Promise<void> => {
      const num = index + 1;
      const total = offerList.length;
      const offerLabel = `${offer.job_title} @ ${offer.company_name}`;

      if (Date.now() - startTime > GLOBAL_TIMEOUT_MS) {
        console.log("[process-linkedin-offers] Timeout global approché, arrêt");
        return;
      }

      try {
        console.log(`[process-linkedin-offers] Offre ${num}/${total} : ${offerLabel}`);

        let analysisResult: {
          isRelevant: boolean;
          confidence: number;
          matchedThemes: string[];
          detectedConcepts: string[];
          reason: string;
        } | null;

        const existingAnalysis = offer.analysis_result as Record<string, unknown> | null | undefined;
        if (existingAnalysis && typeof existingAnalysis === "object" && "isRelevant" in existingAnalysis) {
          analysisResult = {
            isRelevant: !!existingAnalysis.isRelevant,
            confidence: Number(existingAnalysis.confidence) ?? 0,
            matchedThemes: Array.isArray(existingAnalysis.matchedThemes) ? existingAnalysis.matchedThemes.map(String) : [],
            detectedConcepts: Array.isArray(existingAnalysis.detectedConcepts) ? existingAnalysis.detectedConcepts.map(String) : [],
            reason: String(existingAnalysis.reason ?? ""),
          };
        } else {
          const analysisRes = await invokeFunction(
            supabaseUrl,
            serviceRoleKey,
            "analyze-job-offer",
            {
              job_description: offer.job_description ?? "",
              themes,
            }
          );

          if (!analysisRes.ok) {
            console.error(`[process-linkedin-offers] Offre ${num} analyse-job-offer échec`, analysisRes.error);
            stats.errors++;
            return;
          }

          const analysisData = analysisRes.data?.data as {
            isRelevant?: boolean;
            confidence?: number;
            matchedThemes?: string[];
            detectedConcepts?: string[];
            reason?: string;
          } | undefined;

          analysisResult = analysisData
            ? {
                isRelevant: !!analysisData.isRelevant,
                confidence: analysisData.confidence ?? 0,
                matchedThemes: analysisData.matchedThemes ?? [],
                detectedConcepts: analysisData.detectedConcepts ?? [],
                reason: analysisData.reason ?? "",
              }
            : null;

          await supabase
            .from("linkedin_job_offers")
            .update({ analysis_result: analysisResult })
            .eq("id", offer.id);

          stats.analyzed_offers++;
        }

        const isRelevant = analysisResult?.isRelevant === true && (analysisResult?.confidence ?? 0) >= 50;
        const matchedThemes = analysisResult?.matchedThemes ?? [];

        console.log(`[process-linkedin-offers] Offre ${num} résultat analyse : pertinent=${isRelevant}, confidence=${analysisResult?.confidence ?? 0}`);

        if (!isRelevant) return;

        stats.relevant_offers++;

        let companyId = offer.company_id;
        const companyNameNorm = normalizeCompanyName(offer.company_name);
        const companyUrlNorm = normalizeLinkedInUrl(offer.company_linkedin_url);
        if (!companyId && (companyNameNorm || companyUrlNorm !== null)) {
          const { data: existing } = await supabase
            .from("linkedin_companies")
            .select("id")
            .eq("territory_id", territoryId)
            .eq("name", companyNameNorm)
            .eq("linkedin_url", companyUrlNorm)
            .maybeSingle();

          if (existing?.id) {
            companyId = existing.id;
          } else {
            const { data: inserted } = await supabase
              .from("linkedin_companies")
              .insert({
                territory_id: territoryId,
                name: companyNameNorm || "Inconnu",
                linkedin_url: companyUrlNorm,
              })
              .select("id")
              .single();
            companyId = inserted?.id ?? null;
          }
        }

        if (!companyId) {
          console.warn(`[process-linkedin-offers] Offre ${num} pas de company_id, skip enrichissement`);
          return;
        }

        const extractRes = await invokeFunction(
          supabaseUrl,
          serviceRoleKey,
          "extract-company-website",
          {
            company_id: companyId,
            linkedin_url: offer.company_linkedin_url ?? undefined,
            territory_id: territoryId,
          }
        );

        const websiteUrl =
          extractRes.ok && extractRes.data?.website_url
            ? (extractRes.data.website_url as string)
            : null;
        const websiteSource = extractRes.ok ? (extractRes.data?.source as string) ?? "—" : "—";

        console.log(`[process-linkedin-offers] Offre ${num} si pertinent : website trouvé=${!!websiteUrl}, source=${websiteSource}`);

        if (!websiteUrl) return;

        stats.enriched_companies++;

        const seoRes = await invokeFunction(
          supabaseUrl,
          serviceRoleKey,
          "trigger-seo-audit",
          {
            website_url: websiteUrl,
            territory_id: null,
            company_id: companyId,
          }
        );

        const seoAudit =
          seoRes.ok && seoRes.data
            ? {
                seo_score: (seoRes.data as { seo_score?: number }).seo_score ?? 0,
                performance_score: (seoRes.data as { performance_score?: number }).performance_score ?? 0,
                accessibility_score: (seoRes.data as { accessibility_score?: number }).accessibility_score ?? 0,
                best_practices_score: (seoRes.data as { best_practices_score?: number }).best_practices_score ?? 0,
              }
            : null;

        if (seoRes.ok && seoAudit) {
          console.log(`[process-linkedin-offers] Offre ${num} si website : SEO audit score=${seoAudit.seo_score}`);
        }

        const activityRes = await invokeFunction(
          supabaseUrl,
          serviceRoleKey,
          "analyze-company-activity",
          { website_url: websiteUrl }
        );

        const companyAnalysis =
          activityRes.ok && activityRes.data?.data
            ? (activityRes.data.data as Record<string, unknown>)
            : null;

        if (activityRes.ok && companyAnalysis) {
          console.log(`[process-linkedin-offers] Offre ${num} company analysis sector=${(companyAnalysis.sector as string) ?? "—"}`);
        }

        const companyUpdate: Record<string, unknown> = {
          website_url: websiteUrl,
          company_analysis: companyAnalysis ?? null,
          relevance_score: analysisResult?.confidence ?? null,
          updated_at: new Date().toISOString(),
        };
        const auditId = seoRes.ok && (seoRes.data as { audit_id?: string })?.audit_id
          ? (seoRes.data as { audit_id: string }).audit_id
          : null;
        if (auditId) companyUpdate.seo_audit_id = auditId;

        await supabase
          .from("linkedin_companies")
          .update(companyUpdate)
          .eq("id", companyId);

        const { data: companyRow } = await supabase
          .from("linkedin_companies")
          .select("custom_proposal")
          .eq("id", companyId)
          .maybeSingle();
        const existingProposal = (companyRow as { custom_proposal?: string | null } | null)?.custom_proposal;
        if (existingProposal && existingProposal.trim().length > 0) {
          console.log(`[process-linkedin-offers] Offre ${num} : proposition déjà présente, skip génération`);
          return;
        }

        const proposalRes = await invokeFunction(
          supabaseUrl,
          serviceRoleKey,
          "generate-commercial-proposal",
          {
            job_offer: {
              title: offer.job_title,
              description: offer.job_description ?? "",
              company_name: offer.company_name,
              matched_themes: matchedThemes,
            },
            seo_audit: seoAudit,
            company_info: companyAnalysis,
            matched_themes: matchedThemes,
          }
        );

        if (!proposalRes.ok || !proposalRes.data?.data) {
          console.warn(`[process-linkedin-offers] Offre ${num} generate-commercial-proposal échec`, proposalRes.error);
          const errMsg = (typeof proposalRes.error === "string" ? proposalRes.error : "Échec génération proposition").slice(0, 500);
          const { error: updateErr } = await supabase
            .from("linkedin_companies")
            .update({
              proposal_error: errMsg,
              updated_at: new Date().toISOString(),
            })
            .eq("id", companyId);
          if (updateErr) {
            console.warn(`[process-linkedin-offers] Offre ${num} update proposal_error échoué (colonne absente?), ignoré`, updateErr.message);
          }
          return;
        }

        const proposal = proposalRes.data.data as { title?: string; message?: string };
        const proposalMessage = proposal.message ?? "";
        const proposalTitle = proposal.title ?? "";

        console.log(`[process-linkedin-offers] Offre ${num} si proposition : longueur message=${proposalMessage.length}`);
        console.log(`[process-linkedin-offers] Titre généré`, { titre: proposalTitle.slice(0, 50) + "…" });

        const successPayload = {
          custom_proposal: proposalMessage,
          proposal_status: "draft",
          proposal_error: null,
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        let { error: updateErr } = await supabase
          .from("linkedin_companies")
          .update(successPayload)
          .eq("id", companyId);

        if (updateErr) {
          console.warn(`[process-linkedin-offers] Offre ${num} update avec proposal_error échoué, retry sans proposal_error`, updateErr.message);
          const { error: retryErr } = await supabase
            .from("linkedin_companies")
            .update({
              custom_proposal: proposalMessage,
              proposal_status: "draft",
              analyzed_at: successPayload.analyzed_at,
              updated_at: successPayload.updated_at,
            })
            .eq("id", companyId);
          if (retryErr) {
            console.error(`[process-linkedin-offers] Offre ${num} update custom_proposal échoué`, retryErr);
          }
        }

        stats.proposals_generated++;
      } catch (err) {
        stats.errors++;
        console.error(`[process-linkedin-offers] Offre ${num} erreur`, err);
      }
    };

    let hasMore = false;
    for (let i = 0; i < offerList.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > maxDurationMs) {
        console.log("[process-linkedin-offers] Limite de durée atteinte, arrêt (has_more=true)");
        hasMore = true;
        break;
      }
      if (Date.now() - startTime > GLOBAL_TIMEOUT_MS) {
        console.log("[process-linkedin-offers] Timeout global atteint, arrêt du traitement");
        hasMore = true;
        break;
      }

      const batch = offerList.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((offer, batchIndex) => processOneOffer(offer, i + batchIndex))
      );

      for (let r = 0; r < results.length; r++) {
        if (results[r].status === "rejected") {
          stats.errors++;
          console.error("[process-linkedin-offers] Batch promise rejetée", (results[r] as PromiseRejectedResult).reason);
        }
      }
    }

    const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    console.log("[process-linkedin-offers] Statistiques finales", {
      ...stats,
      processing_time_seconds: processingTimeSeconds,
    });

    let warning: string | undefined;
    if (stats.total_offers > 0 && stats.analyzed_offers === 0) {
      warning =
        "Aucune offre n'a pu être analysée. Vérifiez : 1) OPENAI_API_KEY dans les Secrets Supabase ; 2) les logs Edge Functions (analyze-job-offer) ; 3) que l'acteur Apify renvoie bien les descriptions des offres (job_description).";
      console.warn("[process-linkedin-offers]", warning);
    }

    return jsonResponse(
      {
        success: true,
        stats: {
          ...stats,
          processing_time_seconds: processingTimeSeconds,
        },
        ...(hasMore ? { has_more: true } : {}),
        ...(warning ? { warning } : {}),
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[process-linkedin-offers] Erreur inattendue:", message);
    console.error("[process-linkedin-offers] Stack:", err instanceof Error ? err.stack : String(err));
    // Retourner 200 avec success: false pour que le client reçoive le message d'erreur réel (au lieu de "non-2xx")
    return jsonResponse(
      {
        success: false,
        error: message,
      },
      200
    );
  }
});
