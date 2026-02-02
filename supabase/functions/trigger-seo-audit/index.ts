/**
 * Edge Function : lancer un audit SEO via PageSpeed Insights et enregistrer le résultat dans seo_analyses.
 * Optionnel : lier l'audit à une entreprise LinkedIn (company_id) et mettre à jour linkedin_companies.seo_audit_id.
 * Variable d'environnement requise : PAGESPEED_API_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Corps de la requête */
interface TriggerSEOAuditRequest {
  /** URL du site à analyser */
  website_url: string;
  /** Optionnel : territoire (null pour les audits LinkedIn) */
  territory_id?: string | null;
  /** Optionnel : lier l'audit à l'entreprise LinkedIn et mettre à jour seo_audit_id */
  company_id?: string | null;
}

/** Réponse succès */
interface TriggerSEOAuditSuccess {
  success: true;
  audit_id: string;
  seo_score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
}

/** Réponse échec */
interface TriggerSEOAuditError {
  success: false;
  error: string;
}

function jsonResponse(
  body: TriggerSEOAuditSuccess | TriggerSEOAuditError,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Valide et normalise l'URL du site (doit être absolue).
 */
function validateWebsiteUrl(url: string): string | null {
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return u.origin;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[trigger-seo-audit] Requête reçue", req.method);

  try {
    let body: TriggerSEOAuditRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[trigger-seo-audit] Body JSON invalide");
      return jsonResponse(
        { success: false, error: "Body JSON invalide (website_url requis)." },
        400
      );
    }

    const websiteUrl = validateWebsiteUrl(body.website_url ?? "");
    if (!websiteUrl) {
      console.error("[trigger-seo-audit] website_url invalide", body.website_url);
      return jsonResponse(
        { success: false, error: "website_url est requis et doit être une URL valide." },
        400
      );
    }

    const territoryId =
      typeof body.territory_id === "string" && body.territory_id.trim()
        ? body.territory_id.trim()
        : null;
    const companyId =
      typeof body.company_id === "string" && body.company_id.trim()
        ? body.company_id.trim()
        : null;

    console.log("[trigger-seo-audit] URL analysée", { website_url: websiteUrl });

    const apiKey = Deno.env.get("PAGESPEED_API_KEY");
    if (!apiKey) {
      console.error("[trigger-seo-audit] PAGESPEED_API_KEY non configurée");
      return jsonResponse(
        { success: false, error: "Clé API PageSpeed non configurée (PAGESPEED_API_KEY)." },
        500
      );
    }

    const params = new URLSearchParams();
    params.set("url", websiteUrl);
    params.set("key", apiKey);
    params.set("strategy", "mobile");
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");

    const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    console.log("[trigger-seo-audit] Appel PageSpeed Insights...");

    let pageSpeedResponse: Response;
    try {
      pageSpeedResponse = await fetch(pageSpeedUrl);
    } catch (fetchErr) {
      console.error("[trigger-seo-audit] Appel PageSpeed : échec (réseau)", fetchErr);
      return jsonResponse(
        { success: false, error: "Impossible de joindre l'API PageSpeed (réseau)." },
        500
      );
    }

    if (pageSpeedResponse.status === 429) {
      console.warn("[trigger-seo-audit] Appel PageSpeed : rate limit (429)");
      return jsonResponse(
        { success: false, error: "Quota PageSpeed dépassé. Veuillez réessayer plus tard." },
        429
      );
    }

    if (!pageSpeedResponse.ok) {
      const errText = await pageSpeedResponse.text();
      console.error("[trigger-seo-audit] Appel PageSpeed : échec", pageSpeedResponse.status, errText?.slice(0, 300));
      return jsonResponse(
        {
          success: false,
          error: `PageSpeed API a échoué (${pageSpeedResponse.status}). ${errText?.slice(0, 200) || ""}`,
        },
        500
      );
    }

    let pageSpeedData: {
      error?: { message?: string };
      lighthouseResult?: {
        categories?: {
          performance?: { score?: number };
          accessibility?: { score?: number };
          "best-practices"?: { score?: number };
          seo?: { score?: number };
        };
        audits?: Record<string, unknown>;
      };
    };

    try {
      pageSpeedData = await pageSpeedResponse.json();
    } catch (parseErr) {
      console.error("[trigger-seo-audit] Appel PageSpeed : réponse JSON invalide", parseErr);
      return jsonResponse(
        { success: false, error: "Réponse PageSpeed invalide (JSON)." },
        500
      );
    }

    if (pageSpeedData?.error) {
      const msg = pageSpeedData.error?.message ?? "Erreur PageSpeed";
      console.error("[trigger-seo-audit] Appel PageSpeed : erreur API", msg);
      return jsonResponse(
        { success: false, error: msg },
        500
      );
    }

    const lighthouse = pageSpeedData?.lighthouseResult;
    if (!lighthouse?.categories) {
      console.error("[trigger-seo-audit] Appel PageSpeed : lighthouseResult ou categories manquants");
      return jsonResponse(
        { success: false, error: "Réponse PageSpeed sans lighthouseResult.categories." },
        500
      );
    }

    const perf = lighthouse.categories.performance?.score ?? 0;
    const a11y = lighthouse.categories.accessibility?.score ?? 0;
    const best = lighthouse.categories["best-practices"]?.score ?? 0;
    const seo = lighthouse.categories.seo?.score ?? 0;

    const performanceScore = Math.round(perf * 100);
    const accessibilityScore = Math.round(a11y * 100);
    const bestPracticesScore = Math.round(best * 100);
    const seoCategoryScore = Math.round(seo * 100);

    const seoScore = Math.round(
      (performanceScore + accessibilityScore + bestPracticesScore + seoCategoryScore) / 4
    );

    console.log("[trigger-seo-audit] Appel PageSpeed : succès");
    console.log("[trigger-seo-audit] Scores extraits", {
      performance: performanceScore,
      accessibility: accessibilityScore,
      best_practices: bestPracticesScore,
      seo: seoCategoryScore,
      moyenne_seo_score: seoScore,
    });

    const analyzedAt = new Date().toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const insertPayload: Record<string, unknown> = {
      website_url: websiteUrl,
      seo_score: seoScore,
      performance_score: performanceScore,
      accessibility_score: accessibilityScore,
      best_practices_score: bestPracticesScore,
      full_report: lighthouse,
      analyzed_at: analyzedAt,
    };

    // territory_id null = audit LinkedIn (nécessite que la colonne soit nullable en base)
    insertPayload.territory_id = territoryId ?? null;

    const { data: insertedRow, error: insertError } = await supabase
      .from("seo_analyses")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      console.error("[trigger-seo-audit] Insertion DB : échec", insertError);
      return jsonResponse(
        {
          success: false,
          error: `Insertion seo_analyses échouée : ${insertError.message}.${territoryId === null ? " (territory_id null peut nécessiter une migration si la colonne est NOT NULL)" : ""}`,
        },
        500
      );
    }

    const auditId = insertedRow?.id as string;
    console.log("[trigger-seo-audit] Insertion DB : succès avec audit_id", auditId);

    if (companyId && auditId) {
      const { error: updateCompanyError } = await supabase
        .from("linkedin_companies")
        .update({
          seo_audit_id: auditId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyId);

      if (updateCompanyError) {
        console.warn("[trigger-seo-audit] Mise à jour linkedin_companies.seo_audit_id : échec", updateCompanyError);
      } else {
        console.log("[trigger-seo-audit] Si company_id : mise à jour linkedin_companies réussie", { company_id: companyId });
      }
    }

    return jsonResponse(
      {
        success: true,
        audit_id: auditId,
        seo_score: seoScore,
        performance_score: performanceScore,
        accessibility_score: accessibilityScore,
        best_practices_score: bestPracticesScore,
      },
      200
    );
  } catch (err) {
    console.error("[trigger-seo-audit] Erreur inattendue", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
