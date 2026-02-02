/**
 * Modal d'affichage des détails complets d'une entreprise enrichie :
 * infos, rapport SEO, analyse, proposition, offres liées.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ExternalLink,
  BarChart3,
  Target,
  FileText,
  Briefcase,
  Edit,
  Copy,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EnrichedCompanyRow, CompanyAnalysisData } from "@/modules/kernel/hooks/useEnrichedCompanies";
import type { SEOAnalysis } from "@/modules/kernel/components/SEOAnalysis/SEOAnalysisResults";
import { SEOAnalysisResults } from "@/modules/kernel/components/SEOAnalysis/SEOAnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface RelatedOffer {
  id: string;
  job_title: string;
  job_url: string | null;
  job_location: string | null;
  search_id: string;
}

interface CompanyDetailsModalProps {
  company: EnrichedCompanyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditProposal?: (company: EnrichedCompanyRow) => void;
  onMarkAsSent?: (companyId: string) => void;
}

function buildSEOAnalysis(company: EnrichedCompanyRow): SEOAnalysis | null {
  const seo = company.seo_analysis;
  if (!seo) return null;
  return {
    id: seo.id,
    territory_id: seo.territory_id ?? "",
    website_url: seo.website_url ?? company.website_url ?? "",
    seo_score: seo.seo_score,
    performance_score: seo.performance_score,
    accessibility_score: seo.accessibility_score,
    best_practices_score: seo.best_practices_score,
    meta_description: seo.meta_description ?? null,
    has_meta_description: seo.has_meta_description ?? false,
    title_tag: seo.title_tag ?? null,
    has_viewport: seo.has_viewport ?? false,
    is_crawlable: seo.is_crawlable ?? false,
    full_report: (seo.full_report as Record<string, unknown>) ?? {},
    created_at: seo.created_at ?? "",
    analyzed_at: seo.analyzed_at ?? "",
  };
}

export function CompanyDetailsModal({
  company,
  open,
  onOpenChange,
  onEditProposal,
  onMarkAsSent,
}: CompanyDetailsModalProps) {
  const [relatedOffers, setRelatedOffers] = useState<RelatedOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !company?.id) {
      setRelatedOffers([]);
      return;
    }
    let cancelled = false;
    setLoadingOffers(true);
    supabase
      .from("linkedin_job_offers")
      .select("id, job_title, job_url, job_location, search_id")
      .eq("company_id", company.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoadingOffers(false);
        if (!error) setRelatedOffers((data as RelatedOffer[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [open, company?.id]);

  const seoAnalysis = company ? buildSEOAnalysis(company) : null;
  const analysis = (company?.company_analysis ?? null) as CompanyAnalysisData | null;

  const handleCopyProposal = () => {
    if (!company?.custom_proposal) return;
    navigator.clipboard.writeText(company.custom_proposal);
    toast({ title: "Proposition copiée dans le presse-papier." });
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.name}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overflow-x-hidden px-6 h-[70vh] min-h-[300px]">
          <div className="space-y-6 pb-6">
            {/* Liens */}
            <div className="flex flex-wrap gap-3">
              {company.linkedin_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Voir sur LinkedIn
                  </a>
                </Button>
              )}
              {company.website_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.website_url.startsWith("http") ? company.website_url : `https://${company.website_url}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Site web
                  </a>
                </Button>
              )}
            </div>

            {/* Rapport SEO complet */}
            {seoAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Rapport SEO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SEOAnalysisResults analysis={seoAnalysis} projectName={company.name} />
                </CardContent>
              </Card>
            )}

            {/* Analyse entreprise */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Analyse entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-base leading-relaxed">
                  {(analysis.sector || analysis.industry) && (
                    <p>
                      <span className="font-medium text-muted-foreground">Secteur / Industrie :</span>{" "}
                      {[analysis.sector, analysis.industry].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  {analysis.companySize && (
                    <p>
                      <span className="font-medium text-muted-foreground">Taille :</span>{" "}
                      {analysis.companySize}
                    </p>
                  )}
                  {analysis.aboutSummary && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Résumé</p>
                      <p className="text-foreground whitespace-pre-wrap break-words">{analysis.aboutSummary}</p>
                    </div>
                  )}
                  {(analysis.identifiedNeeds?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-2">Besoins identifiés</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.identifiedNeeds!.map((n) => (
                          <Badge key={n} variant="secondary" className="text-sm py-1">{n}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.targetAudience && (
                    <p>
                      <span className="font-medium text-muted-foreground">Audience cible :</span>{" "}
                      {analysis.targetAudience}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Proposition complète ou raison de l'absence */}
            {company.custom_proposal ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Proposition commerciale
                  </CardTitle>
                  {company.analyzed_at && (
                    <p className="text-sm text-muted-foreground">
                      Analyse du {format(new Date(company.analyzed_at), "d MMMM yyyy", { locale: fr })}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant={company.proposal_status === "sent" ? "default" : company.proposal_status === "responded" ? "secondary" : "outline"}>
                    {company.proposal_status === "sent" ? "Envoyée" : company.proposal_status === "responded" ? "Réponse reçue" : "Brouillon"}
                  </Badge>
                  <div className="rounded-lg border bg-muted/30 p-4 text-base leading-relaxed whitespace-pre-wrap break-words min-h-[200px] max-h-[55vh] overflow-y-scroll overscroll-contain">
                    {company.custom_proposal}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-500/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <FileText className="h-4 w-4" />
                    Proposition non générée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {company.proposal_error
                      ? company.proposal_error
                      : "Souvent dû à un timeout : le traitement a été interrompu avant d'enregistrer la proposition pour cette entreprise (beaucoup d'offres traitées). Les logs montrent que generate-commercial-proposal réussit ; process-linkedin-offers peut être arrêté par la plateforme. Relancez une recherche plus ciblée ou consultez les logs Edge Functions."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Offres liées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Offres liées
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOffers ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : relatedOffers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune offre liée.</p>
                ) : (
                  <ul className="space-y-2">
                    {relatedOffers.map((offer) => (
                      <li key={offer.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{offer.job_title}</span>
                        {offer.job_location && (
                          <span className="text-muted-foreground">{offer.job_location}</span>
                        )}
                        {offer.job_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={offer.job_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Separator />
        <DialogFooter className="px-6 py-4 shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {company.custom_proposal && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopyProposal}>
                <Copy className="h-4 w-4 mr-1" />
                Copier la proposition
              </Button>
              {onEditProposal && (
                <Button variant="outline" size="sm" onClick={() => onEditProposal(company)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier la proposition
                </Button>
              )}
              {(company.proposal_status === "draft" || !company.proposal_status) && onMarkAsSent && (
                <Button size="sm" onClick={() => onMarkAsSent(company.id)}>
                  <Send className="h-4 w-4 mr-1" />
                  Marquer comme envoyée
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
