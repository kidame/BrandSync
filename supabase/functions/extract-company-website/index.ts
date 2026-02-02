/**
 * Edge Function : extraire l'URL du site web d'une entreprise.
 * Priorité : 1) linkedin_companies.website_url, 2) raw des offres (Apify), 3) scrape page LinkedIn.
 * Met à jour linkedin_companies.website_url dès qu'un site est trouvé (étape 2 ou 3).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Corps de la requête */
interface ExtractCompanyWebsiteRequest {
  /** ID de l'entreprise dans linkedin_companies */
  company_id?: string;
  /** URL LinkedIn de l'entreprise */
  linkedin_url?: string;
  /** Optionnel : filtrer par territoire */
  territory_id?: string;
}

/** Source de l'URL trouvée */
type WebsiteSource = "database" | "job_offer_raw" | "linkedin_scrape" | "not_found";

/** Réponse succès */
interface ExtractCompanyWebsiteSuccess {
  success: true;
  website_url: string | null;
  source: WebsiteSource;
}

/** Réponse échec */
interface ExtractCompanyWebsiteError {
  success: false;
  error: string;
}

/** Ligne linkedin_companies (pour les requêtes) */
interface CompanyRow {
  id: string;
  website_url: string | null;
  linkedin_url: string | null;
}

/**
 * Nettoie et valide une URL de site web (hors LinkedIn, etc.).
 */
function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = u.hostname.toLowerCase();
    if (
      host.includes("linkedin.com") ||
      host.includes("facebook.com") ||
      host.includes("twitter.com") ||
      host.includes("instagram.com") ||
      host === "localhost"
    ) {
      return null;
    }
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Vérifie qu'une URL ressemble à une page entreprise LinkedIn.
 */
function isValidLinkedInCompanyUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.hostname === "www.linkedin.com" || u.hostname === "linkedin.com") &&
      u.pathname.startsWith("/company/")
    );
  } catch {
    return false;
  }
}

/**
 * Extrait l'URL du site depuis le HTML de la page LinkedIn.
 */
function extractWebsiteFromHtml(html: string): string | null {
  const jsonLdMatch = html.match(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      const content = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
      const urlMatch = content.match(/"url"\s*:\s*"https?:\/\/[^"]+"/);
      if (urlMatch) {
        const raw = urlMatch[0].replace(/^"url"\s*:\s*"/, "").replace(/"$/, "");
        const normalized = normalizeWebsiteUrl(raw);
        if (normalized) return normalized;
      }
    }
  }

  const hrefMatches = html.matchAll(
    /href\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*(?:data-[^=]*=\s*["'][^"']*website|website[^"']*["'])/gi
  );
  for (const m of hrefMatches) {
    const normalized = normalizeWebsiteUrl(m[1]);
    if (normalized) return normalized;
  }

  const websiteLinkMatch = html.match(
    /(?:website|site\s*web|company\s*website)[^>]*href\s*=\s*["'](https?:\/\/[^"']+)["']/i
  );
  if (websiteLinkMatch) {
    const normalized = normalizeWebsiteUrl(websiteLinkMatch[1]);
    if (normalized) return normalized;
  }

  const hrefBeforeWebsite = html.match(
    /href\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>[\s\S]*?(?:website|site\s*web)/i
  );
  if (hrefBeforeWebsite) {
    const normalized = normalizeWebsiteUrl(hrefBeforeWebsite[1]);
    if (normalized) return normalized;
  }

  const dataUrlMatch = html.match(
    /data-[^=]*url[^=]*=\s*["'](https?:\/\/[^"']+)["']/i
  );
  if (dataUrlMatch) {
    const normalized = normalizeWebsiteUrl(dataUrlMatch[1]);
    if (normalized) return normalized;
  }

  return null;
}

function jsonResponse(
  body: ExtractCompanyWebsiteSuccess | ExtractCompanyWebsiteError,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[extract-company-website] Requête reçue", req.method);

  try {
    let body: ExtractCompanyWebsiteRequest;
    try {
      body = await req.json();
    } catch {
      console.error("[extract-company-website] Body JSON invalide");
      return jsonResponse(
        { success: false, error: "Body JSON invalide (company_id ou linkedin_url requis)." },
        400
      );
    }

    const companyId =
      typeof body.company_id === "string" ? body.company_id.trim() || undefined : undefined;
    const linkedinUrl =
      typeof body.linkedin_url === "string" ? body.linkedin_url.trim() || undefined : undefined;
    const territoryId =
      typeof body.territory_id === "string" ? body.territory_id.trim() || undefined : undefined;

    if (!companyId && !linkedinUrl) {
      console.error("[extract-company-website] Ni company_id ni linkedin_url fourni");
      return jsonResponse(
        { success: false, error: "Au moins un des deux : company_id ou linkedin_url est requis." },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let companyRow: CompanyRow | null = null;
    let companyIdForUpdate: string | null = null;
    let linkedinUrlForScrape: string | null = null;

    // ----- Étape 1 : Chercher dans linkedin_companies.website_url -----
    console.log("[extract-company-website] Étape 1 : recherche website_url en base (linkedin_companies)");

    if (companyId) {
      const { data, error } = await supabase
        .from("linkedin_companies")
        .select("id, website_url, linkedin_url")
        .eq("id", companyId)
        .maybeSingle();

      if (error) {
        console.error("[extract-company-website] Erreur SELECT par company_id", error);
        return jsonResponse(
          { success: false, error: error.message },
          500
        );
      }
      companyRow = data as CompanyRow | null;
    } else if (linkedinUrl) {
      let query = supabase
        .from("linkedin_companies")
        .select("id, website_url, linkedin_url")
        .eq("linkedin_url", linkedinUrl);

      if (territoryId) {
        query = query.eq("territory_id", territoryId);
      }
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("[extract-company-website] Erreur SELECT par linkedin_url", error);
        return jsonResponse(
          { success: false, error: error.message },
          500
        );
      }
      companyRow = data as CompanyRow | null;
    }

    if (companyRow) {
      companyIdForUpdate = companyRow.id;
      linkedinUrlForScrape = companyRow.linkedin_url;

      const existingUrl = companyRow.website_url?.trim() || null;
      if (existingUrl && normalizeWebsiteUrl(existingUrl)) {
        console.log("[extract-company-website] Étape 1 : website_url trouvé en DB ? oui", {
          website_url: existingUrl,
        });
        return jsonResponse(
          { success: true, website_url: normalizeWebsiteUrl(existingUrl), source: "database" },
          200
        );
      }
    }

    console.log("[extract-company-website] Étape 1 : website_url trouvé en DB ? non");

    // ----- Étape 2 : Chercher dans linkedin_job_offers.raw (companyWebsite / website) -----
    console.log("[extract-company-website] Étape 2 : recherche raw.companyWebsite / raw.website dans linkedin_job_offers");

    let rawWebsite: string | null = null;

    if (companyIdForUpdate) {
      const { data: offerList, error: offerError } = await supabase
        .from("linkedin_job_offers")
        .select("raw")
        .eq("company_id", companyIdForUpdate)
        .limit(1);

      const offerRow = Array.isArray(offerList) ? offerList[0] : null;
      if (!offerError && offerRow?.raw && typeof offerRow.raw === "object") {
        const raw = offerRow.raw as Record<string, unknown>;
        rawWebsite =
          (raw.companyWebsite as string)?.trim() ||
          (raw.website as string)?.trim() ||
          null;
      }
    }

    if (!rawWebsite && (linkedinUrl || companyRow?.linkedin_url)) {
      const urlToMatch = linkedinUrl || companyRow!.linkedin_url;
      const { data: offerList, error: offerError } = await supabase
        .from("linkedin_job_offers")
        .select("raw, company_id")
        .eq("company_linkedin_url", urlToMatch)
        .limit(1);

      const offerRow = Array.isArray(offerList) ? offerList[0] : null;
      if (!offerError && offerRow?.raw && typeof offerRow.raw === "object") {
        const raw = offerRow.raw as Record<string, unknown>;
        rawWebsite =
          (raw.companyWebsite as string)?.trim() ||
          (raw.website as string)?.trim() ||
          null;
        if (rawWebsite && offerRow.company_id && !companyIdForUpdate) {
          companyIdForUpdate = offerRow.company_id as string;
        }
      }
    }

    if (rawWebsite) {
      const normalized = normalizeWebsiteUrl(rawWebsite);
      if (normalized) {
        console.log("[extract-company-website] Étape 2 : raw.companyWebsite ou raw.website trouvé ? oui", {
          valeur: normalized,
        });

        if (companyIdForUpdate) {
          const { error: updateError } = await supabase
            .from("linkedin_companies")
            .update({
              website_url: normalized,
              updated_at: new Date().toISOString(),
            })
            .eq("id", companyIdForUpdate);

          if (updateError) {
            console.warn("[extract-company-website] Étape 2 : échec mise à jour linkedin_companies", updateError);
          } else {
            console.log("[extract-company-website] Étape 2 : linkedin_companies.website_url mis à jour");
          }
        }

        return jsonResponse(
          { success: true, website_url: normalized, source: "job_offer_raw" },
          200
        );
      }
    }

    console.log("[extract-company-website] Étape 2 : raw.companyWebsite ou raw.website trouvé ? non");

    // ----- Étape 3 : Scraper la page LinkedIn entreprise -----
    const urlToScrape = linkedinUrlForScrape || linkedinUrl || null;

    if (urlToScrape && isValidLinkedInCompanyUrl(urlToScrape)) {
      console.log("[extract-company-website] Étape 3 : scraping LinkedIn tenté", {
        linkedin_url: urlToScrape,
      });

      let html: string;
      try {
        const response = await fetch(urlToScrape, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          },
          redirect: "follow",
        });

        if (!response.ok) {
          console.log("[extract-company-website] Étape 3 : scraping LinkedIn tenté ? échec (HTTP " + response.status + ")");
        } else {
          html = await response.text();
          const scrapedUrl = extractWebsiteFromHtml(html);

          if (scrapedUrl) {
            console.log("[extract-company-website] Étape 3 : scraping LinkedIn tenté ? succès", {
              website_url: scrapedUrl,
            });

            if (companyIdForUpdate) {
              const { error: updateError } = await supabase
                .from("linkedin_companies")
                .update({
                  website_url: scrapedUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", companyIdForUpdate);

              if (updateError) {
                console.warn("[extract-company-website] Étape 3 : échec mise à jour linkedin_companies", updateError);
              } else {
                console.log("[extract-company-website] Étape 3 : linkedin_companies.website_url mis à jour");
              }
            }

            return jsonResponse(
              { success: true, website_url: scrapedUrl, source: "linkedin_scrape" },
              200
            );
          }
        }
      } catch (fetchErr) {
        console.error("[extract-company-website] Étape 3 : scraping LinkedIn tenté ? échec (exception)", fetchErr);
      }
    } else {
      console.log("[extract-company-website] Étape 3 : scraping non tenté (pas de linkedin_url valide)");
    }

    // ----- Étape 4 : Aucune source trouvée -----
    console.log("[extract-company-website] Résultat final : website_url retourné = null (source: not_found)");
    return jsonResponse(
      { success: true, website_url: null, source: "not_found" },
      200
    );
  } catch (err) {
    console.error("[extract-company-website] Erreur inattendue", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
