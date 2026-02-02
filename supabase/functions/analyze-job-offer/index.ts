/**
 * Edge Function : analyse IA d'une offre LinkedIn.
 * Interprète largement les thèmes (ex: SEO → référencement, optimisation web, etc.)
 * et retourne un JSON structuré (isRelevant, matchedThemes, confidence, detectedConcepts, reason).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Corps de la requête */
interface AnalyzeJobOfferRequest {
  /** Description complète de l'offre (texte LinkedIn) */
  job_description: string;
  /** Thèmes définis par l'utilisateur (tableau ou chaîne à découper) */
  themes: string[] | string;
}

/** Réponse JSON attendue de l'IA */
interface JobOfferAnalysisResult {
  isRelevant: boolean;
  matchedThemes: string[];
  confidence: number;
  detectedConcepts: string[];
  reason: string;
}

/**
 * Normalise les thèmes : chaîne → tableau (lignes ou virgules), trim, sans vide.
 */
function normalizeThemes(themes: string[] | string): string[] {
  if (Array.isArray(themes)) {
    return themes
      .flatMap((t) => String(t).split(/[\n,]/))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(themes)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[analyze-job-offer] Requête reçue", req.method);

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[analyze-job-offer] OPENAI_API_KEY non configurée");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Clé API OpenAI non configurée",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let body: AnalyzeJobOfferRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[analyze-job-offer] Body JSON invalide");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Body JSON invalide (job_description, themes requis)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jobDescription =
      typeof body.job_description === "string"
        ? body.job_description.trim()
        : "";
    const themes = normalizeThemes(body.themes ?? []);

    if (themes.length === 0) {
      console.error("[analyze-job-offer] Aucun thème fourni");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Au moins un thème est requis (themes: string[] ou string)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[analyze-job-offer] Thèmes normalisés:", themes.length, themes);
    console.log("[analyze-job-offer] Longueur description:", jobDescription.length);

    // Si la description est vide (scraper n'a pas renvoyé de description), on renvoie directement non pertinent
    if (!jobDescription) {
      console.warn("[analyze-job-offer] job_description vide — renvoi isRelevant: false");
      return new Response(
        JSON.stringify({
          data: {
            isRelevant: false,
            confidence: 0,
            matchedThemes: [],
            detectedConcepts: [],
            reason: "Description de l'offre non fournie par le scraping.",
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prompt orienté "bon prospect client" pour agence SEO / marketing digital
    const systemPrompt = `Tu es un expert en prospection B2B pour une agence de marketing digital / SEO en Suisse romande.

Ta tâche : déterminer si l'entreprise qui publie cette offre d'emploi est un BON PROSPECT pour des services de SEO, création de sites web, gestion réseaux sociaux, publicité en ligne, création de contenu et branding.

---

CRITÈRES D'UN BON PROSPECT :

1. SECTEURS CIBLES (bonus de score) :
   - Tourisme, hôtellerie, restauration
   - Horlogerie, luxe
   - Communes, collectivités, institutions publiques
   - PME locales suisses (commerce, artisanat, services)

2. SIGNAUX POSITIFS (l'entreprise a besoin d'aide externe) :
   - Recrute un poste marketing JUNIOR ou GÉNÉRALISTE (stagiaire, assistant, coordinateur, chargé de...)
   - Recrute leur PREMIER poste marketing/communication
   - Mots-clés dans l'offre : "refonte site", "améliorer visibilité", "développer présence digitale", "stratégie réseaux sociaux", "content creator", "community manager"
   - Le marketing/digital n'est PAS le cœur de métier de l'entreprise
   - Petite structure sans équipe marketing établie

3. SIGNAUX NÉGATIFS (À EXCLURE) :
   - Poste SENIOR : "Head of", "Director", "CMO", "VP", "Senior Manager", "Lead"
   - L'entreprise EST une agence (digitale, SEO, marketing, communication, web, pub)
   - Grande entreprise avec équipe marketing structurée
   - Multinationale ou grand groupe (> 500 employés)

---

RÈGLES DE SCORING :

- isRelevant = true SI : au moins 2 signaux positifs ET aucun signal négatif majeur
- confidence >= 70 : secteur cible + signaux positifs clairs
- confidence 50-69 : signaux positifs mais secteur neutre
- confidence < 50 : doute ou signaux mixtes → isRelevant = false

---

RÉPONSE JSON UNIQUEMENT :

{
  "isRelevant": boolean,
  "matchedThemes": ["secteur1", "secteur2"],
  "confidence": number (0-100),
  "detectedConcepts": ["signal1", "signal2"],
  "reason": "Explication courte en français"
}

IMPORTANT : On cherche des CLIENTS POTENTIELS pour vendre des services, PAS des offres d'emploi pour postuler.`;

    const userPrompt = `Analyse cette offre d'emploi LinkedIn.

QUESTION : L'entreprise qui recrute est-elle un bon prospect pour acheter des services SEO / marketing digital ?

Secteurs prioritaires : ${JSON.stringify(themes)}

---

OFFRE D'EMPLOI :

Titre : (voir dans la description)

Description :
${jobDescription.slice(0, 6000)}

---

Réponds UNIQUEMENT avec l'objet JSON.`;

    console.log("[analyze-job-offer] Appel OpenAI...");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("[analyze-job-offer] Erreur OpenAI:", openaiRes.status, errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API error: ${openaiRes.status}`,
          details: errText.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiRes.json();
    const content = openaiData?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[analyze-job-offer] Réponse OpenAI sans content", openaiData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Réponse OpenAI invalide (pas de content)",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: JobOfferAnalysisResult;
    try {
      result = JSON.parse(content) as JobOfferAnalysisResult;
    } catch (e) {
      console.error("[analyze-job-offer] JSON invalide dans la réponse:", content?.slice(0, 200), e);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Réponse IA non parsable en JSON",
          raw: content.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validation minimale du schéma
    if (typeof result.isRelevant !== "boolean") result.isRelevant = false;
    if (!Array.isArray(result.matchedThemes)) result.matchedThemes = [];
    if (typeof result.confidence !== "number")
      result.confidence = result.isRelevant ? 70 : 0;
    result.confidence = Math.max(0, Math.min(100, Math.round(result.confidence)));
    if (!Array.isArray(result.detectedConcepts)) result.detectedConcepts = [];
    if (typeof result.reason !== "string") result.reason = "";

    console.log("[analyze-job-offer] Succès:", {
      isRelevant: result.isRelevant,
      confidence: result.confidence,
      matchedThemes: result.matchedThemes?.length,
      detectedConcepts: result.detectedConcepts?.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[analyze-job-offer] Erreur inattendue:", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
