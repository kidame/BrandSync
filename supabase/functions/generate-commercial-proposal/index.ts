/**
 * Edge Function : générer une proposition commerciale personnalisée.
 * Combine offre d'emploi, audit SEO (optionnel), infos entreprise (optionnel) et thèmes matchés.
 * BrandSync : agence intelligence de marque, SEO, stratégie digitale.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Infos entreprise (aligné avec CompanyAnalysisResult de analyze-company-activity) */
interface CompanyAnalysisResult {
  sector?: string;
  industry?: string;
  services?: string[];
  aboutSummary?: string;
  identifiedNeeds?: string[];
  companySize?: string;
  targetAudience?: string;
}

/** Offre d'emploi */
interface JobOfferInput {
  title: string;
  description: string;
  company_name: string;
  matched_themes: string[];
}

/** Audit SEO optionnel */
interface SEOAuditInput {
  seo_score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
}

/** Corps de la requête */
interface GenerateCommercialProposalRequest {
  job_offer: JobOfferInput;
  seo_audit?: SEOAuditInput | null;
  company_info?: CompanyAnalysisResult | null;
  matched_themes: string[];
}

/** Proposition générée */
interface CommercialProposal {
  title: string;
  message: string;
}

/** Réponse succès */
interface GenerateCommercialProposalSuccess {
  success: true;
  data: CommercialProposal;
}

/** Réponse échec */
interface GenerateCommercialProposalError {
  success: false;
  error: string;
}

const TITLE_MIN_CHARS = 50;
const TITLE_MAX_CHARS = 80;
const MESSAGE_MIN_WORDS = 250;
const MESSAGE_MAX_WORDS = 550;

function jsonResponse(
  body: GenerateCommercialProposalSuccess | GenerateCommercialProposalError,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[generate-commercial-proposal] Requête reçue", req.method);

  try {
    let body: GenerateCommercialProposalRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[generate-commercial-proposal] Body JSON invalide");
      return jsonResponse(
        { success: false, error: "Body JSON invalide (job_offer requis)." },
        400
      );
    }

    const jobOffer = body.job_offer;
    if (!jobOffer || typeof jobOffer !== "object") {
      console.error("[generate-commercial-proposal] job_offer manquant ou invalide");
      return jsonResponse(
        { success: false, error: "job_offer est requis et doit être un objet (title, description, company_name, matched_themes)." },
        400
      );
    }

    const title = typeof jobOffer.title === "string" ? jobOffer.title.trim() : "";
    const companyName = typeof jobOffer.company_name === "string" ? jobOffer.company_name.trim() : "";
    if (!title || !companyName) {
      console.error("[generate-commercial-proposal] job_offer.title ou company_name manquant");
      return jsonResponse(
        { success: false, error: "job_offer.title et job_offer.company_name sont requis." },
        400
      );
    }

    const description = typeof jobOffer.description === "string" ? jobOffer.description.trim() : "";
    const matchedThemes = Array.isArray(body.matched_themes)
      ? body.matched_themes
      : Array.isArray(jobOffer.matched_themes)
        ? jobOffer.matched_themes
        : [];

    console.log("[generate-commercial-proposal] Données d'entrée reçues", {
      company_name: companyName,
      job_title: title,
      matched_themes: matchedThemes,
    });

    const seoAudit = body.seo_audit ?? null;
    if (seoAudit && typeof seoAudit === "object") {
      console.log("[generate-commercial-proposal] Présence de seo_audit : oui", {
        seo_score: seoAudit.seo_score,
        performance_score: seoAudit.performance_score,
        accessibility_score: seoAudit.accessibility_score,
        best_practices_score: seoAudit.best_practices_score,
      });
    } else {
      console.log("[generate-commercial-proposal] Présence de seo_audit : non");
    }

    const companyInfo = body.company_info ?? null;
    if (companyInfo && typeof companyInfo === "object") {
      console.log("[generate-commercial-proposal] Présence de company_info : oui", {
        sector: companyInfo.sector ?? "—",
        industry: companyInfo.industry ?? "—",
      });
    } else {
      console.log("[generate-commercial-proposal] Présence de company_info : non");
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[generate-commercial-proposal] OPENAI_API_KEY non configurée");
      return jsonResponse(
        { success: false, error: "Clé API OpenAI non configurée." },
        500
      );
    }

    const systemPrompt = `Tu es un rédacteur pour BrandSync, une agence spécialisée en intelligence de marque, SEO et stratégie digitale.

Contexte BrandSync :
- Nous proposons : audits SEO, formation SEO, stratégie de contenu, analyse de présence digitale
- Notre approche : data-driven, basée sur l'analyse des territoires de marque
- Nos clients : PME et startups ambitieuses en Suisse et France

Tu génères une proposition commerciale personnalisée pour une entreprise qui recrute. Tu reçois :
- L'offre d'emploi (poste, description, entreprise, thèmes qui ont matché)
- Optionnel : résultats d'un audit SEO de leur site
- Optionnel : infos sur l'entreprise (secteur, services, besoins identifiés)

Tu renvoies UNIQUEMENT un objet JSON valide, sans markdown, sans commentaires, avec exactement deux clés :
- title : titre accrocheur de 50 à 80 caractères, qui fait référence au besoin détecté via l'offre d'emploi
- message : message de prospection en français, entre 300 et 500 mots

Structure du message (à adapter selon le contexte) :
1. Accroche : On a vu que vous recrutez un [poste]
2. Constat : Cela révèle votre volonté de [besoin identifié]
3. Insight SEO (si audit fourni) : Notre analyse rapide de votre site montre un score SEO de X/100, avec des opportunités sur [points faibles]
4. Notre expertise : Nous aidons les entreprises du secteur [sector] à [bénéfices]
5. Proposition de valeur : Formation SEO, audit approfondi, stratégie de contenu (adapter selon thèmes matchés)
6. Call-to-action : Échange de 15 minutes pour discuter

Ton : professionnel mais pas corporate, personnalisé et spécifique, basé sur les faits (offre, audit, secteur), orienté solution et valeur. Toujours en français.`;

    const seoBlock =
      seoAudit && typeof seoAudit.seo_score === "number"
        ? `\n\nAudit SEO de leur site :\n- Score SEO : ${seoAudit.seo_score}/100\n- Performance : ${seoAudit.performance_score ?? "—"}/100\n- Accessibilité : ${seoAudit.accessibility_score ?? "—"}/100\n- Bonnes pratiques : ${seoAudit.best_practices_score ?? "—"}/100`
        : "";

    const companyBlock =
      companyInfo && typeof companyInfo === "object"
        ? `\n\nInfos entreprise :\n- Secteur : ${companyInfo.sector ?? "—"}\n- Industrie : ${companyInfo.industry ?? "—"}\n- Services : ${Array.isArray(companyInfo.services) ? companyInfo.services.join(", ") : "—"}\n- Besoins identifiés : ${Array.isArray(companyInfo.identifiedNeeds) ? companyInfo.identifiedNeeds.join(", ") : "—"}\n- Taille : ${companyInfo.companySize ?? "—"}\n- Audience cible : ${companyInfo.targetAudience ?? "—"}`
        : "";

    const userPrompt = `Génère la proposition commerciale (title + message) pour cette entreprise.

Offre d'emploi :
- Poste : ${title}
- Entreprise : ${companyName}
- Description (extrait) : ${description.slice(0, 1500)}
- Thèmes qui ont matché (à intégrer dans la proposition) : ${matchedThemes.join(", ") || "—"}${seoBlock}${companyBlock}

Retourne uniquement le JSON avec "title" (50-80 caractères) et "message" (300-500 mots, en français).`;

    console.log("[generate-commercial-proposal] Appel OpenAI...");

    let openaiRes: Response;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
    } catch (fetchErr) {
      console.error("[generate-commercial-proposal] Appel OpenAI : échec (réseau)", fetchErr);
      return jsonResponse(
        { success: false, error: "Impossible de joindre l'API OpenAI." },
        500
      );
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("[generate-commercial-proposal] Appel OpenAI : échec", openaiRes.status, errText?.slice(0, 300));
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
      console.error("[generate-commercial-proposal] Réponse OpenAI invalide (pas de content)");
      return jsonResponse(
        { success: false, error: "Réponse OpenAI invalide (pas de content)." },
        500
      );
    }

    console.log("[generate-commercial-proposal] Appel OpenAI : succès");

    let data: CommercialProposal;
    try {
      data = JSON.parse(content) as CommercialProposal;
    } catch {
      console.error("[generate-commercial-proposal] Réponse OpenAI : JSON invalide");
      return jsonResponse(
        { success: false, error: "Réponse OpenAI non parsable en JSON." },
        500
      );
    }

    if (!data || typeof data !== "object") {
      return jsonResponse(
        { success: false, error: "Réponse OpenAI : structure invalide (title, message attendus)." },
        500
      );
    }

    const proposalTitle = typeof data.title === "string" ? data.title.trim() : "";
    const proposalMessage = typeof data.message === "string" ? data.message.trim() : "";

    if (!proposalTitle || !proposalMessage) {
      return jsonResponse(
        { success: false, error: "Réponse OpenAI : title ou message manquant." },
        500
      );
    }

    const titleLen = proposalTitle.length;
    const msgWords = wordCount(proposalMessage);

    if (titleLen < TITLE_MIN_CHARS || titleLen > TITLE_MAX_CHARS) {
      console.warn("[generate-commercial-proposal] Titre hors plage 50-80 caractères", { length: titleLen });
    }
    if (msgWords < MESSAGE_MIN_WORDS || msgWords > MESSAGE_MAX_WORDS) {
      console.warn("[generate-commercial-proposal] Message hors plage 300-500 mots", { words: msgWords });
    }

    console.log("[generate-commercial-proposal] Longueur du message généré", { mots: msgWords });
    console.log("[generate-commercial-proposal] Titre généré", { titre: proposalTitle.slice(0, 60) + (proposalTitle.length > 60 ? "…" : ""), longueur: titleLen });

    return jsonResponse(
      {
        success: true,
        data: {
          title: proposalTitle,
          message: proposalMessage,
        },
      },
      200
    );
  } catch (err) {
    console.error("[generate-commercial-proposal] Erreur inattendue", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
