/**
 * Edge Function : analyser l'activité d'une entreprise à partir de son site web.
 * Fetch des pages (accueil, à propos, services), extraction du texte, analyse OpenAI → CompanyAnalysisResult.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Corps de la requête */
interface AnalyzeCompanyActivityRequest {
  website_url: string;
}

/** Résultat structuré attendu (aligné avec CompanyAnalysisResult + champs étendus) */
interface CompanyAnalysisResult {
  sector: string;
  industry: string;
  services: string[];
  aboutSummary: string;
  identifiedNeeds: string[];
  companySize: string;
  targetAudience: string;
}

/** Réponse succès */
interface AnalyzeCompanyActivitySuccess {
  success: true;
  data: CompanyAnalysisResult;
}

/** Réponse échec */
interface AnalyzeCompanyActivityError {
  success: false;
  error: string;
}

const FETCH_TIMEOUT_MS = 10000;
const MAX_CHARS_PER_PAGE = 8000;

/** Chemins à tester pour "À propos" et "Services" */
const ABOUT_PATHS = ["/about", "/a-propos", "/about-us", "/qui-sommes-nous"];
const SERVICES_PATHS = ["/services", "/nos-services", "/what-we-do"];

function jsonResponse(
  body: AnalyzeCompanyActivitySuccess | AnalyzeCompanyActivityError,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

/**
 * Fetch une URL avec timeout de 10 secondes.
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<{ ok: boolean; html: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const html = await res.text();
    return { ok: res.ok, html };
  } catch (e) {
    clearTimeout(timeoutId);
    return { ok: false, html: "" };
  }
}

/**
 * Extrait le texte lisible du HTML : enlève scripts, styles, nav, footer,
 * garde le contenu principal, limite à maxChars caractères.
 */
function extractTextFromHtml(html: string, maxChars: number = MAX_CHARS_PER_PAGE): string {
  let text = html;

  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, " ");

  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  text = text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
  }
  return text;
}

/**
 * Tente de récupérer le contenu d'une page en essayant chaque chemin (baseUrl + path).
 */
async function fetchPageWithPaths(
  baseUrl: string,
  paths: string[]
): Promise<{ url: string; text: string } | null> {
  const base = baseUrl.replace(/\/$/, "");
  const fullUrls = paths.map((p) => base + (p.startsWith("/") ? p : "/" + p));
  for (const url of fullUrls) {
    const { ok, html } = await fetchWithTimeout(url);
    if (ok && html?.length > 50) {
      const text = extractTextFromHtml(html);
      if (text.length > 100) {
        return { url, text };
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[analyze-company-activity] Requête reçue", req.method);

  try {
    let body: AnalyzeCompanyActivityRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[analyze-company-activity] Body JSON invalide");
      return jsonResponse(
        { success: false, error: "Body JSON invalide (website_url requis)." },
        400
      );
    }

    const websiteUrl = validateWebsiteUrl(body.website_url ?? "");
    if (!websiteUrl) {
      console.error("[analyze-company-activity] website_url invalide", body.website_url);
      return jsonResponse(
        { success: false, error: "website_url est requis et doit être une URL valide." },
        400
      );
    }

    console.log("[analyze-company-activity] URL analysée", { website_url: websiteUrl });

    const pageContents: { url: string; text: string }[] = [];

    const homeRes = await fetchWithTimeout(websiteUrl);
    if (homeRes.ok && homeRes.html?.length > 50) {
      const text = extractTextFromHtml(homeRes.html);
      if (text.length > 50) {
        pageContents.push({ url: websiteUrl, text });
        console.log("[analyze-company-activity] Page fetchée : accueil", { url: websiteUrl, longueur: text.length });
      } else {
        console.log("[analyze-company-activity] Page fetchée : accueil échec (texte insuffisant)");
      }
    } else {
      console.log("[analyze-company-activity] Page fetchée : accueil échec (timeout ou HTTP)");
    }

    const aboutPage = await fetchPageWithPaths(websiteUrl, ABOUT_PATHS);
    if (aboutPage) {
      pageContents.push(aboutPage);
      console.log("[analyze-company-activity] Page fetchée : à propos", { url: aboutPage.url, longueur: aboutPage.text.length });
    } else {
      console.log("[analyze-company-activity] Page fetchée : à propos échec");
    }

    const servicesPage = await fetchPageWithPaths(websiteUrl, SERVICES_PATHS);
    if (servicesPage) {
      pageContents.push(servicesPage);
      console.log("[analyze-company-activity] Page fetchée : services", { url: servicesPage.url, longueur: servicesPage.text.length });
    } else {
      console.log("[analyze-company-activity] Page fetchée : services échec");
    }

    if (pageContents.length === 0) {
      console.error("[analyze-company-activity] Aucune page récupérée");
      return jsonResponse(
        { success: false, error: "Impossible d'accéder au site." },
        500
      );
    }

    const combinedContent = pageContents
      .map((p) => `--- Page: ${p.url} ---\n${p.text}`)
      .join("\n\n");

    const totalChars = combinedContent.length;
    console.log("[analyze-company-activity] Longueur du contenu envoyé à OpenAI", { totalChars });

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[analyze-company-activity] OPENAI_API_KEY non configurée");
      return jsonResponse(
        { success: false, error: "Clé API OpenAI non configurée." },
        500
      );
    }

    const systemPrompt = `Tu es un expert en analyse d'entreprises et de sites web. Tu analyses le contenu des pages web fournies et tu renvoies UNIQUEMENT un objet JSON valide, sans markdown, sans commentaires, avec exactement les clés suivantes (toutes des strings sauf services et identifiedNeeds qui sont des tableaux de strings) :
- sector : secteur d'activité principal (ex: "Alimentation", "Technology", "Retail")
- industry : industrie (ex: "E-commerce", "SaaS", "Manufacturing")
- services : liste des services ou produits offerts
- aboutSummary : résumé en 2-3 phrases de ce que fait l'entreprise
- identifiedNeeds : besoins business potentiels détectés (ex: "SEO", "visibilité", "contenu", "réseaux sociaux")
- companySize : "Startup", "PME", "Grande entreprise", ou "Indéterminé" selon les indices (effectifs, envergure)
- targetAudience : audience cible si détectable, sinon "Non spécifié"`;

    const userPrompt = `Analyse le contenu suivant extrait du site web de l'entreprise (plusieurs pages possibles) et retourne le JSON structuré demandé.\n\n${combinedContent.slice(0, 28000)}`;

    console.log("[analyze-company-activity] Appel OpenAI...");

    let openaiRes: Response;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });
    } catch (fetchErr) {
      console.error("[analyze-company-activity] Appel OpenAI : échec (réseau)", fetchErr);
      return jsonResponse(
        { success: false, error: "Impossible de joindre l'API OpenAI." },
        500
      );
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("[analyze-company-activity] Appel OpenAI : échec", openaiRes.status, errText?.slice(0, 300));
      return jsonResponse(
        {
          success: false,
          error: `OpenAI a échoué (${openaiRes.status}). ${errText?.slice(0, 200) || ""}`,
        },
        500
      );
    }

    const openaiData = await openaiRes.json();
    const content = openaiData?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[analyze-company-activity] Réponse OpenAI invalide (pas de content)");
      return jsonResponse(
        { success: false, error: "Réponse OpenAI invalide (pas de content)." },
        500
      );
    }

    console.log("[analyze-company-activity] Appel OpenAI : succès");

    let data: CompanyAnalysisResult;
    try {
      data = JSON.parse(content) as CompanyAnalysisResult;
    } catch {
      console.error("[analyze-company-activity] Réponse OpenAI : JSON invalide");
      return jsonResponse(
        { success: false, error: "Réponse OpenAI non parsable en JSON." },
        500
      );
    }

    if (!data || typeof data !== "object") {
      return jsonResponse(
        { success: false, error: "Réponse OpenAI : structure invalide." },
        500
      );
    }

    if (typeof data.sector !== "string") data.sector = "";
    if (typeof data.industry !== "string") data.industry = "";
    if (!Array.isArray(data.services)) data.services = [];
    if (typeof data.aboutSummary !== "string") data.aboutSummary = "";
    if (!Array.isArray(data.identifiedNeeds)) data.identifiedNeeds = [];
    if (typeof data.companySize !== "string") data.companySize = "Indéterminé";
    if (typeof data.targetAudience !== "string") data.targetAudience = "Non spécifié";

    console.log("[analyze-company-activity] Résultat structuré retourné", {
      sector: data.sector,
      industry: data.industry,
      servicesCount: data.services?.length ?? 0,
      identifiedNeedsCount: data.identifiedNeeds?.length ?? 0,
    });

    return jsonResponse({ success: true, data }, 200);
  } catch (err) {
    console.error("[analyze-company-activity] Erreur inattendue", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
