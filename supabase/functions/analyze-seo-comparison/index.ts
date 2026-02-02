/**
 * Edge Function : analyse IA des différences Mobile vs Desktop (scores SEO, Core Web Vitals).
 * OpenAI GPT-4o-mini génère des recommandations actionnables en markdown.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeSEOComparisonRequest {
  website_url: string;
  mobile_scores: { seo: number; performance: number; accessibility: number; bestPractices: number };
  desktop_scores: { seo: number; performance: number; accessibility: number; bestPractices: number };
  mobile_metrics?: { fcp: number; lcp: number; tbt: number; cls: number; si: number; tti: number };
  desktop_metrics?: { fcp: number; lcp: number; tbt: number; cls: number; si: number; tti: number };
  images_without_alt_count?: number;
  render_blocking_count?: number;
  unused_js_bytes?: number;
}

interface AnalyzeSEOComparisonSuccess {
  success: true;
  analysis: string;
  priority: "low" | "medium" | "high" | "critical";
  key_issues: string[];
}

interface AnalyzeSEOComparisonError {
  success: false;
  error: string;
}

/** Toujours retourner 200 pour que le client puisse lire le corps JSON (success/error). */
function jsonResponse(
  body: AnalyzeSEOComparisonSuccess | AnalyzeSEOComparisonError
): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `Tu es un expert SEO et performance web. Analyse les différences entre les scores Mobile et Desktop d'un site web et fournis des recommandations actionnables.

Tu dois retourner un objet JSON avec exactement les clés suivantes :
- "analysis" : string (texte en markdown, voir format ci-dessous)
- "priority" : une des valeurs "low" | "medium" | "high" | "critical" (priorité globale)
- "key_issues" : tableau de strings (liste des 3 à 5 problèmes clés en une phrase chacun)

Format du champ "analysis" (markdown) :
1. **Constat principal** (2-3 phrases)
2. **Points critiques** (liste numérotée avec recommandations)
3. **Points positifs** (ce qui va bien)
4. **Impact SEO estimé** (Faible/Modéré/Élevé/Critique)

Sois concis mais précis. Utilise des emojis pour la lisibilité (📱 🖥️ ✅ ⚠️ 🔴).
Mentionne le Mobile-First Index de Google si pertinent.

Seuils officiels Core Web Vitals :
- FCP : bon < 1.8s, moyen < 3s, mauvais > 3s
- LCP : bon < 2.5s, moyen < 4s, mauvais > 4s
- TBT : bon < 200ms, moyen < 600ms, mauvais > 600ms
- CLS : bon < 0.1, moyen < 0.25, mauvais > 0.25`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Méthode non autorisée. Utilisez POST." });
  }

  try {
    let body: AnalyzeSEOComparisonRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Body JSON invalide." });
    }

    const websiteUrl = body.website_url ?? "";
    const mobileScores = body.mobile_scores ?? {};
    const desktopScores = body.desktop_scores ?? {};
    if (!websiteUrl || typeof mobileScores.performance !== "number" || typeof desktopScores.performance !== "number") {
      return jsonResponse({ success: false, error: "website_url, mobile_scores et desktop_scores requis." });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return jsonResponse({ success: false, error: "OPENAI_API_KEY non configurée. Configurez le secret dans Supabase (Edge Functions → Secrets)." });
    }

    const userContent = `Site : ${websiteUrl}

Scores Mobile : SEO ${mobileScores.seo ?? 0}, Performance ${mobileScores.performance ?? 0}, Accessibilité ${mobileScores.accessibility ?? 0}, Bonnes pratiques ${mobileScores.bestPractices ?? 0}
Scores Desktop : SEO ${desktopScores.seo ?? 0}, Performance ${desktopScores.performance ?? 0}, Accessibilité ${desktopScores.accessibility ?? 0}, Bonnes pratiques ${desktopScores.bestPractices ?? 0}
${body.mobile_metrics ? `
Métriques Mobile (CWV) : FCP ${(body.mobile_metrics.fcp / 1000).toFixed(2)}s, LCP ${(body.mobile_metrics.lcp / 1000).toFixed(2)}s, TBT ${body.mobile_metrics.tbt}ms, CLS ${body.mobile_metrics.cls.toFixed(2)}, SI ${(body.mobile_metrics.si / 1000).toFixed(2)}s, TTI ${(body.mobile_metrics.tti / 1000).toFixed(2)}s
` : ""}${body.desktop_metrics ? `
Métriques Desktop (CWV) : FCP ${(body.desktop_metrics.fcp / 1000).toFixed(2)}s, LCP ${(body.desktop_metrics.lcp / 1000).toFixed(2)}s, TBT ${body.desktop_metrics.tbt}ms, CLS ${body.desktop_metrics.cls.toFixed(2)}, SI ${(body.desktop_metrics.si / 1000).toFixed(2)}s, TTI ${(body.desktop_metrics.tti / 1000).toFixed(2)}s
` : ""}${body.images_without_alt_count != null ? `\nImages sans alt : ${body.images_without_alt_count}` : ""}${body.render_blocking_count != null ? `\nRessources bloquantes : ${body.render_blocking_count}` : ""}${body.unused_js_bytes != null ? `\nJS inutilisé (octets) : ${body.unused_js_bytes}` : ""}

Analyse les différences et retourne le JSON avec "analysis" (markdown), "priority" et "key_issues".`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("[analyze-seo-comparison] OpenAI error", openaiRes.status, errText?.slice(0, 300));
      if (openaiRes.status === 429) {
        return jsonResponse({ success: false, error: "Quota API OpenAI dépassé. Réessayez plus tard." });
      }
      return jsonResponse({ success: false, error: `OpenAI a échoué (${openaiRes.status}).` });
    }

    const openaiData = await openaiRes.json();
    const content = openaiData?.choices?.[0]?.message?.content;
    if (!content) {
      return jsonResponse({ success: false, error: "Réponse OpenAI vide." });
    }

    let parsed: { analysis?: string; priority?: string; key_issues?: string[] };
    try {
      parsed = JSON.parse(content) as { analysis?: string; priority?: string; key_issues?: string[] };
    } catch {
      return jsonResponse({ success: false, error: "Réponse OpenAI : JSON invalide." });
    }

    const priority = ["low", "medium", "high", "critical"].includes(parsed.priority ?? "")
      ? (parsed.priority as "low" | "medium" | "high" | "critical")
      : "medium";
    const analysis = typeof parsed.analysis === "string" ? parsed.analysis : "";
    const key_issues = Array.isArray(parsed.key_issues) ? parsed.key_issues.filter((x) => typeof x === "string") : [];

    return jsonResponse({ success: true, analysis, priority, key_issues });
  } catch (err) {
    console.error("[analyze-seo-comparison] Erreur", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return jsonResponse({ success: false, error: message });
  }
});
